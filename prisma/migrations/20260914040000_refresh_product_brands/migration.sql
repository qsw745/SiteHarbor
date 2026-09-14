-- Update the known legacy entries in place, preserving IDs, slugs and visit counts.
UPDATE "Site"
SET "name" = '岁时',
    "description" = '农历生日提醒：记下家人朋友的重要日子，自动计算下一次生日，用邮件送达及时的提醒。',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "url" IN ('https://qisw.top/birthday/', 'https://qisw.top/birthday')
  AND "name" IN ('生日提醒', '生日提醒中心');

UPDATE "Site"
SET "iconUrl" = 'https://qisw.top/birthday/favicon.svg', "updatedAt" = CURRENT_TIMESTAMP
WHERE "url" IN ('https://qisw.top/birthday/', 'https://qisw.top/birthday')
  AND ("iconUrl" IS NULL OR "iconUrl" = '');

UPDATE "Site"
SET "name" = '问衡',
    "description" = 'AI 智能测评与学习平台：从题库练习、在线考试到阅卷与学习进度，让每一次练习都有反馈。',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "url" IN ('https://qisw.top/exam/', 'https://qisw.top/exam', 'https://qisw.top/wenheng/', 'https://qisw.top/wenheng')
  AND "name" IN ('在线考试系统', '在线考试', 'Exam');

UPDATE "Site"
SET "iconUrl" = 'https://qisw.top/wenheng/brand-logo.svg', "updatedAt" = CURRENT_TIMESTAMP
WHERE "url" IN ('https://qisw.top/exam/', 'https://qisw.top/exam', 'https://qisw.top/wenheng/', 'https://qisw.top/wenheng')
  AND ("iconUrl" IS NULL OR "iconUrl" = '' OR "iconUrl" IN ('https://qisw.top/exam/brand-logo.svg', 'https://qisw.top/exambrand-logo.svg', 'https://qisw.top/wenhengbrand-logo.svg'));

UPDATE "Site"
SET "url" = 'https://qisw.top/wenheng/', "updatedAt" = CURRENT_TIMESTAMP
WHERE "url" IN ('https://qisw.top/exam/', 'https://qisw.top/exam');
