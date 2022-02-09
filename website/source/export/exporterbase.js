OV.ExportedFile = class
{
	constructor (name)
	{
		this.name = name;
		this.content = null;
	}

	GetName ()
	{
		return this.name;
	}

	SetName (name)
	{
		this.name = name;
	}

	GetTextContent ()
	{
		let text = OV.ArrayBufferToUtf8String (this.content);
		return text;
	}

	GetBufferContent ()
	{
		return this.content;
	}

	SetTextContent (content)
	{
		let buffer = OV.Utf8StringToArrayBuffer (content);
		this.content = buffer;
	}

	SetBufferContent (content)
	{
		this.content = content;
	}
};

OV.ExporterBase = class
{
    constructor ()
    {

    }

    CanExport (format, extension)
    {
        return false;
    }
    
	Export (model, format, onFinish)
	{
		let files = [];
		this.ExportContent (model, format, files, () => {
			onFinish (files);
		});
	}

	ExportContent (model, format, files, onFinish)
	{

	}

	GetExportedMaterialName (originalName)
	{
		return this.GetExportedName (originalName, 'Material');
	}
	
	GetExportedMeshName (originalName)
	{
		return this.GetExportedName (originalName, 'Mesh');
	}	

	GetExportedName (originalName, defaultName)
	{
		if (originalName.length === 0) {
			return defaultName;
		}
		return originalName;
	}
};
