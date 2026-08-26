-- Make newly-added payment columns immediately available to PostgREST.
notify pgrst, 'reload schema';
