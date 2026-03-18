
-- FIX 1: Checkout Queue Bypass - Remove the permissive user UPDATE policy
-- Users should NOT be able to update their own queue entry (admission is admin-only via admit_queue_batch)
DROP POLICY IF EXISTS "Users can update own queue entry" ON public.checkout_queue;

-- FIX 2: Customization Fields Version Policies - Remove unguarded OR branches
-- Drop and recreate the three broken version policies

DROP POLICY IF EXISTS "Organizers can insert version customization fields" ON public.customization_fields;
DROP POLICY IF EXISTS "Organizers can update version customization fields" ON public.customization_fields;
DROP POLICY IF EXISTS "Organizers can delete version customization fields" ON public.customization_fields;

-- Recreate with proper ownership checks (section_version_id path only)
CREATE POLICY "Organizers can insert version customization fields"
ON public.customization_fields
FOR INSERT
TO authenticated
WITH CHECK (
  section_version_id IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM section_versions sv
    JOIN band_sections bs ON bs.id = sv.section_id
    JOIN bands b ON b.id = bs.band_id
    WHERE sv.id = customization_fields.section_version_id
      AND is_organizer(auth.uid(), b.organizer_id)
  )
);

CREATE POLICY "Organizers can update version customization fields"
ON public.customization_fields
FOR UPDATE
TO authenticated
USING (
  section_version_id IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM section_versions sv
    JOIN band_sections bs ON bs.id = sv.section_id
    JOIN bands b ON b.id = bs.band_id
    WHERE sv.id = customization_fields.section_version_id
      AND is_organizer(auth.uid(), b.organizer_id)
  )
);

CREATE POLICY "Organizers can delete version customization fields"
ON public.customization_fields
FOR DELETE
TO authenticated
USING (
  section_version_id IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM section_versions sv
    JOIN band_sections bs ON bs.id = sv.section_id
    JOIN bands b ON b.id = bs.band_id
    WHERE sv.id = customization_fields.section_version_id
      AND is_organizer(auth.uid(), b.organizer_id)
  )
);
