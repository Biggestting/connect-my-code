INSERT INTO public.user_roles (user_id, role)
VALUES ('f402e93f-acbe-44fc-bdd0-08701502ce31', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;