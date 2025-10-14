-- 为 templates 表增加 prompt_list 字段（JSON 数组），用于多提示词配置
-- 向后兼容：默认空数组，不影响旧数据与读取

ALTER TABLE templates
ADD COLUMN IF NOT EXISTS prompt_list jsonb DEFAULT '[]';

