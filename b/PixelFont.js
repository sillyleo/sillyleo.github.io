/** Object PixelFont
 *	creates canvas with choosed pixel font runtime
 * -----------------------------------------------------------
 * @author		Andrea Giammarchi
 * @site		www.devpro.it
 * @date		2006-10-20
 * @version		CANVAS 0.1
 * -----------------------------------------------------------
 * Public Static Method
 * - Create
 * 	PixelFont.Create(Element:Mixed, Font:PFObject, style:String, value:Object):HTMLCanvasElement
 * @param	Mixed		String/HTMLGenericElement, should contains one or more strings to create Pixel Font graphic version.
 * 				Every nested element will be replaced and CANVAS with Pixel Font String rappresentation will be append as unique childNode.
 *				Generated Pixel Font string should be multile if element text contains one or more "\n" ("Hello\nWorld\n!!!" 3 lines, Hello, World and !!!)
 * @return	PFObject	Pixel Font dedicated Font Object (read line 35 or view AGFont.js file for an example)
 * @return	String		dedicated CANVAS fillStyle string (#123, #123456, rgb(0, 1, 2), rgba(0, 1, 2, 0.5)) rgba uses alpha too
 * @return	Object		an object with 3 keys and values
 *				space		Int32		pixels between two chars
 *				margin		Int32		pixels between each point
 *				size		Inte32		pixels width and height of each point
 *
 *		PixelFont gives you 3 dedicated style objects, plus default object.
 *			PixelFont.Big		generates a big and pixelated version of the string
 *			PixelFont.Bold		generates a bold string (better with uppercase chars)
 *			PixelFont.Dotted	generates an exploded version of the string
 *
 * Public Static Parameters
 * - Big
 * 	PixelFont.Big		Object		dedicated style to have a big font
 * - Bold
 * 	PixelFont.Bold		Object		dedicated style to have a bold font
 * - Dotted
 * 	PixelFont.Dotted	Object		dedicated style to have an "exploded" font
 * -----------------------------------------------------------
 * What is a cell string ?
 *
 * Every Font should contain different key/value parameters.
 * Each key will be respective char code of a single char.
 * For example, zero char '0' char code is 48 then to draw this char
 * Pixel Font should have a UInt32 48 key with respective string coordinates value.
 *
 *	// table object example with only char "0"
 * 	var	GenericFont = {
 *			height:4,		// font height
 *			48:"301235689ab"	// zero char "0"
 *		};
 * 
 * Every string contains markable cells after first width value.
 * In this example 3 is the cell width, then font is a generic 3x4 pixel font.
 * Every other char is a base 36 rappresentation of each markable cells.
 * In this example, zero char coordinates are these:
 * 	------
 *	|0|1|2|
 *	|3| |5|
 *	|6| |8|
 *	|9|a|b|
 *	------
 * that will be a cell with these empty points:
 * 	***
 *	* *
 *	* *
 *	***
 * Maximum pixel font area is 36 (6*6) because
 * Pixel Font is compatible only with Base 36 integers.
 */
if(!window.PixelFont)
PixelFont = new function(){
	
	// static public method to create a pixel font
	this.Create = function(id, Font, style, value){
		function get(id, get){
			return value ? integer(value[id], get) : get;
		};
		function integer(integer, value){
			return integer === undefined ? value : parseInt(integer);
		};
		var	Element = id.constructor === String ? document.getElementById(id) : id,
			Render = new PixelFont.Render(
				Element,
				new PixelFont.Font(Font),
				get("space", 1),
				get("margin", 0),
				get("size", 1)
			);
		Element.appendChild(Render.get());
		return Render.Create(Element.firstChild, Render.Canvas.content, style);
	};
	
	// static public pixel font dedicated styles
	this.Big = {space:2, margin:0, size:2};
	this.Bold = {space:-1, margin:3, size:-2};
	this.Dotted = {space:1, margin:1, size:1};
	
	// static "private" methods to render canvas, manages font and creates values
	this.Canvas = function(Element, Font, space, margin, size){
		this.get = function(){
			return Canvas;
		};
		this.content = "";
		function Create(self, Canvas){
			var	id = null,
				content = nodeValue(Element).replace(/(^\s+|\s+$)/, "").replace(/\n|\r|\r\n|\n\r/g, "\n"),
				string = content.split("\n"),
				rows = string.length,
				subheight = (Font.height * size) + (Font.height * margin + margin) + space,
				c = 0,
				row = 0,
				cell = 0,
				width = 0,
				height = 0,
				length = 0,
				sublength = 0,
				max = Math.max,
				random = Math.random;
			while(row < rows) {
				c = 0;
				sublength = 0;
				length = string[row].length;
				while(c < length){
					cell = parseInt(Font.get(string[row].charAt(c++)).charAt(0), 36);
					sublength += (cell * size) + (cell * margin + margin) + space;
				};
				width = max(width, sublength);
				height += subheight;
				++row;
			};
			do{id = "canvas-".concat(random() * 1234567890)}while(document.getElementById(id));
			Canvas.setAttribute("width", width - space);
			Canvas.setAttribute("height", height - space);
			Canvas.setAttribute("id", id);
			self.content = Canvas.content = content;
			return Canvas;
		};
		function nodeValue(Element){
			var	i = Element.childNodes.length,
				result = [];
			if(Element.nodeType == 3)
				result.push(Element.nodeValue);
			else {
				while(i--) {
					result.push(nodeValue(Element.childNodes[i]));
					Element.removeChild(Element.childNodes[i]);
				};
				result.reverse();
			};
			return result.join("");
		};
		var	Canvas = Create(this, document.createElement("CANVAS"));
	};
	this.Font = function(Font){
		this.get = function(c){
			return Font[c.charCodeAt(0)] || Font[0];
		};
		this.height = Font.height;
	};
	this.Render = function(Element, Font, space, margin, size){
		this.Create = function(Canvas, content, style){
			var	string = content.split("\n"),
				context = Canvas.getContext("2d"),
				height = (Font.height * size) + margin + space,
				rows = string.length,
				row = 0,
				y = 0;
			if(style)
				context.fillStyle = style;
			while(row < rows) {
				Create(Canvas, context, string[row], y);
				y += height;
				++row;
			};
			return Canvas;
		};
		this.get = function(){
			return this.Canvas.get();
		};
		this.Canvas = new PixelFont.Canvas(Element, Font, space, margin, size);
		function Create(Canvas, context, string, y){
			var	length = string.length,
				c = 0,
				x = 0,
				width = 0,
				subc = 0,
				subx = 0,
				sublength = 0,
				pos = 0,
				cell = "",
				floor = Math.floor,
				reverse = size < 0 && window.opera ? Math.abs(size) : false;
			while(c < length) {
				cell = Font.get(string.charAt(c));
				width = parseInt(cell.substr(0, 1), 36);
				for(subc = 1, sublength = cell.length; subc < sublength; subc++) {
					pos = parseInt(cell.charAt(subc), 36);
					subx = (pos % width);
					suby = floor(pos / width);
					subx = (subx * size) + (subx * margin) + margin;
					suby = (suby * size) + (suby * margin) + margin;
					if(reverse)
						context.fillRect(subx + x - reverse, suby + y - reverse, reverse, reverse);
					else
						context.fillRect(subx + x, suby + y, size, size);
				};
				x += (width * size) + (width * margin + margin) + space;
				++c;
			};
		};
	};
};