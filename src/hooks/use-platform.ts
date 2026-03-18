import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function usePlatformSettings() {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      data?.forEach((row: any) => {
        map[row.key] = row.value;
      });
      return map;
    },
  });
}

export function usePlatformSetting(key: string) {
  const { data: settings } = usePlatformSettings();
  return settings?.[key];
}

export function useUpdatePlatformSetting() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ key, value, reason }: { key: string; value: any; reason?: string }) => {
      const { error } = await supabase
        .from("platform_settings")
        .update({ value: JSON.stringify(value), updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq("key", key);
      if (error) throw error;

      if (user) {
        await supabase.from("admin_audit_log").insert({
          admin_id: user.id,
          action: `update_setting:${key}`,
          target_type: "platform",
          target_id: key,
          details: { value, reason },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
    },
  });
}

export function useAdminAction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      targetType,
      targetId,
      details,
      execute,
    }: {
      action: string;
      targetType: string;
      targetId: string;
      details?: any;
      execute: () => Promise<void>;
    }) => {
      await execute();
      if (user) {
        await supabase.from("admin_audit_log").insert({
          admin_id: user.id,
          action,
          target_type: targetType,
          target_id: targetId,
          details,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["platform-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useActiveAnnouncements() {
  return useQuery({
    queryKey: ["active-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_announcements")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).filter((a: any) => !a.expires_at || new Date(a.expires_at) > new Date());
    },
  });
}
