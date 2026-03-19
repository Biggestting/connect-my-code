-- Allow organizers to update and delete their event lineup entries
CREATE POLICY "Organizers can update lineup"
ON public.event_lineup FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM events WHERE events.id = event_lineup.event_id AND is_organizer(auth.uid(), events.organizer_id)
));

CREATE POLICY "Organizers can delete lineup"
ON public.event_lineup FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM events WHERE events.id = event_lineup.event_id AND is_organizer(auth.uid(), events.organizer_id)
));

-- Allow organizers to update and delete their event agenda entries
CREATE POLICY "Organizers can update agenda"
ON public.event_agenda FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM events WHERE events.id = event_agenda.event_id AND is_organizer(auth.uid(), events.organizer_id)
));

CREATE POLICY "Organizers can delete agenda"
ON public.event_agenda FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM events WHERE events.id = event_agenda.event_id AND is_organizer(auth.uid(), events.organizer_id)
));