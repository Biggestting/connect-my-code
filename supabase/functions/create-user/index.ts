import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function findExistingAuthUserByEmail(serviceClient: ReturnType<typeof createClient>, email: string) {
  const perPage = 1000;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage });

    if (error) throw error;

    const existingUser = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email,
    );

    if (existingUser) return existingUser;
    if (data.users.length < perPage) break;
  }

  return null;
}

async function ensureProfile(
  serviceClient: ReturnType<typeof createClient>,
  {
    userId,
    email,
    displayName,
    firstName,
    lastName,
    city,
    country,
    phoneNumber,
  }: {
    userId: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
  },
) {
  const profileData: Record<string, string> = {
    user_id: userId,
    email,
    display_name: displayName,
  };

  if (firstName) profileData.first_name = firstName;
  if (lastName) profileData.last_name = lastName;
  if (city) profileData.city = city;
  if (country) profileData.country = country;
  if (phoneNumber) profileData.phone_number = phoneNumber;

  const { error } = await serviceClient
    .from("profiles")
    .upsert(profileData, { onConflict: "user_id" });

  if (error) {
    console.error("Profile upsert failed:", error);
    throw new Error("Failed to save user profile");
  }
}

async function ensureRole(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  role?: string,
) {
  if (!role || role === "user") return;

  const { error } = await serviceClient
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

  if (error) {
    console.error("Role assignment failed:", error);
    throw new Error("Failed to assign user role");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await anonClient.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const adminUserId = userData.user.id;

    const { data: isAdmin } = await anonClient.rpc("has_role", {
      _user_id: adminUserId,
      _role: "admin",
    });

    if (!isAdmin) {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    const {
      email,
      password,
      display_name,
      first_name,
      last_name,
      city,
      country,
      phone_number,
      role,
    } = await req.json();

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPassword = typeof password === "string" ? password : "";
    const normalizedDisplayName =
      typeof display_name === "string" && display_name.trim()
        ? display_name.trim()
        : normalizedEmail.split("@")[0] || "User";

    if (!normalizedEmail || !normalizedPassword) {
      return jsonResponse({ error: "Email and password are required" }, 400);
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let userId: string;
    let recoveredExistingUser = false;

    const { data: createdUserData, error: createError } = await serviceClient.auth.admin.createUser({
      email: normalizedEmail,
      password: normalizedPassword,
      email_confirm: true,
      user_metadata: {
        display_name: normalizedDisplayName,
      },
    });

    if (createError) {
      const duplicateEmail =
        createError.message.toLowerCase().includes("already been registered") ||
        createError.message.toLowerCase().includes("email address has already been registered");

      if (!duplicateEmail) {
        console.error("User creation error:", createError);
        return jsonResponse({ error: "Failed to create user account" }, 400);
      }

      const existingUser = await findExistingAuthUserByEmail(serviceClient, normalizedEmail);
      if (!existingUser) {
        return jsonResponse({ error: "A user with this email already exists" }, 409);
      }

      userId = existingUser.id;
      recoveredExistingUser = true;
    } else {
      userId = createdUserData.user.id;
    }

    await ensureProfile(serviceClient, {
      userId,
      email: normalizedEmail,
      displayName: normalizedDisplayName,
      firstName: typeof first_name === "string" ? first_name.trim() : undefined,
      lastName: typeof last_name === "string" ? last_name.trim() : undefined,
      city: typeof city === "string" ? city.trim() : undefined,
      country: typeof country === "string" ? country.trim() : undefined,
      phoneNumber: typeof phone_number === "string" ? phone_number.trim() : undefined,
    });

    await ensureRole(serviceClient, userId, role);

    const { error: auditError } = await serviceClient.from("admin_audit_log").insert({
      admin_id: adminUserId,
      action: recoveredExistingUser ? "recover_user_profile" : "create_user",
      target_type: "user",
      target_id: userId,
      details: { email: normalizedEmail, display_name: normalizedDisplayName, role: role || "user" },
    });

    if (auditError) {
      console.error("Audit log failed:", auditError);
    }

    return jsonResponse({
      success: true,
      user_id: userId,
      recovered_existing_user: recoveredExistingUser,
    });
  } catch (err) {
    console.error("create-user error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});