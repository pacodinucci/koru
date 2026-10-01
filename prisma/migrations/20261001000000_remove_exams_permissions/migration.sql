-- Retire access to the removed exams/grades feature without deleting its historical data.
DELETE FROM "Permission" WHERE "key" IN ('exams.view', 'exams.manage');
