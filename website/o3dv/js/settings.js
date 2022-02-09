OV.Theme = {
    //todo
    Light : 2,
    Dark : 1
};

OV.Settings = class
{
    constructor ()
    {
        // this.backgroundColor = new OV.Color (255, 255, 255);
        this.backgroundColor = new OV.Color (42, 43, 46);
        // this.defaultColor = new OV.Color (200, 200, 200);
        this.defaultColor = new OV.Color (42, 43, 46);
        // this.themeId = OV.Theme.Light;
        //todo
        this.themeId = OV.Theme.Dark;
    }

    LoadFromCookies (cookieHandler)
    {
        // this.backgroundColor = cookieHandler.GetColorVal ('ov_background_color', new OV.Color (255, 255, 255));
        this.backgroundColor = cookieHandler.GetColorVal ('ov_background_color', new OV.Color (42, 43, 46));
        // this.defaultColor = cookieHandler.GetColorVal ('ov_default_color', new OV.Color (200, 200, 200));
        this.defaultColor = cookieHandler.GetColorVal ('ov_default_color', new OV.Color (42, 43, 46));
        // this.themeId = cookieHandler.GetIntVal ('ov_theme_id', OV.Theme.Light);
        //todo
        this.themeId = cookieHandler.GetIntVal ('ov_theme_id', OV.Theme.Dark);
    }

    SaveToCookies (cookieHandler)
    {
        cookieHandler.SetColorVal ('ov_background_color', this.backgroundColor);
        cookieHandler.SetColorVal ('ov_default_color', this.defaultColor);
        cookieHandler.SetStringVal ('ov_theme_id', this.themeId);
    }
};
