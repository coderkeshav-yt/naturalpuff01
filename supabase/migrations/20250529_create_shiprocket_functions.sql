-- Create a table to store application settings if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to get Shiprocket configuration
CREATE OR REPLACE FUNCTION get_shiprocket_config()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    config_value JSONB;
BEGIN
    SELECT value INTO config_value FROM app_settings WHERE key = 'shiprocket_config';
    RETURN config_value;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

-- Create function to save Shiprocket configuration
CREATE OR REPLACE FUNCTION save_shiprocket_config(config_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO app_settings (key, value)
    VALUES ('shiprocket_config', config_data)
    ON CONFLICT (key) 
    DO UPDATE SET 
        value = config_data,
        updated_at = NOW();
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Grant access to the functions for authenticated users
GRANT EXECUTE ON FUNCTION get_shiprocket_config TO authenticated;
GRANT EXECUTE ON FUNCTION save_shiprocket_config TO authenticated;

-- Create RLS policies for app_settings table
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read settings
CREATE POLICY app_settings_read_policy ON app_settings
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Create policy to allow all authenticated users to insert/update settings
CREATE POLICY app_settings_write_policy ON app_settings
    FOR ALL
    TO authenticated
    USING (TRUE);
