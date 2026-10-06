-- Point the known products at the icons bundled in public/product-icons/, which mirror
-- each product's native app icon (several product websites still serve older favicons).
-- Matching by URL keeps IDs, slugs and visit counts; other entries are untouched.
-- Timestamps are written as epoch milliseconds, the same representation Prisma uses.

UPDATE "Site"
SET "iconUrl" = '/product-icons/xinqiao.svg', "updatedAt" = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE "url" IN ('https://qisw.top/xinqiao', 'https://qisw.top/xinqiao/');

UPDATE "Site"
SET "iconUrl" = '/product-icons/benliu.webp', "updatedAt" = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE "url" IN ('https://qisw.top/benliu', 'https://qisw.top/benliu/');

UPDATE "Site"
SET "iconUrl" = '/product-icons/birthday.webp', "updatedAt" = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE "url" IN ('https://qisw.top/birthday', 'https://qisw.top/birthday/');

UPDATE "Site"
SET "iconUrl" = '/product-icons/profiledock.webp', "updatedAt" = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE "url" IN ('https://qisw.top/profiledock', 'https://qisw.top/profiledock/');

UPDATE "Site"
SET "iconUrl" = '/product-icons/qingsong-notes.svg', "updatedAt" = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE "url" IN ('https://notes.qisw.top', 'https://notes.qisw.top/', 'https://qisw.top/notes', 'https://qisw.top/notes/');

UPDATE "Site"
SET "iconUrl" = '/product-icons/cloudshellconsole.webp', "updatedAt" = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE "url" IN ('https://qisw.top/cloudshellconsole', 'https://qisw.top/cloudshellconsole/', 'https://qisw.top/cloudshell', 'https://qisw.top/cloudshell/');

UPDATE "Site"
SET "iconUrl" = '/product-icons/wenheng.svg', "updatedAt" = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE "url" IN ('https://qisw.top/wenheng', 'https://qisw.top/wenheng/');

UPDATE "Site"
SET "iconUrl" = '/product-icons/clario.webp', "updatedAt" = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE "url" IN ('https://qisw.top/clario', 'https://qisw.top/clario/');

UPDATE "Site"
SET "iconUrl" = '/product-icons/rdesk.webp', "updatedAt" = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE "url" IN ('https://qisw.top/rdesk', 'https://qisw.top/rdesk/');

UPDATE "Site"
SET "iconUrl" = '/product-icons/volisle.webp', "updatedAt" = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE "url" IN ('https://qisw.top/volisle', 'https://qisw.top/volisle/');
