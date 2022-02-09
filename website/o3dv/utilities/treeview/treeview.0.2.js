/*
	Lists to Trees
	2018-03-07 Jake Nicholson (github.com/shakyjake)
	
	This is free and unencumbered software released into the public domain.

	Anyone is free to copy, modify, publish, use, compile, sell, or
	distribute this software, either in source code form or as a compiled
	binary, for any purpose, commercial or non-commercial, and by any
	means.
	
	In jurisdictions that recognize copyright laws, the author or authors
	of this software dedicate any and all copyright interest in the
	software to the public domain. We make this dedication for the benefit
	of the public at large and to the detriment of our heirs and
	successors. We intend this dedication to be an overt act of
	relinquishment in perpetuity of all present and future rights to this
	software under copyright law.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
	IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
	OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
	ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.
	
	For more information, please refer to <http://unlicense.org/>
	
	V0.2
	 - Can create multiple trees from single selector
*/
var TreeView;
TreeView = function(Selector){
	
	var _ = this;

	_.ClassMatcher = function(Class){
		var RE = new RegExp('(^|(\\s+))' + Class + '($|(\\s+))');
		RE.global = true;
		return RE;
	};
	
	_.AddClass = function(Element, Class){
		if(!!Element.className.length){
			Element.className += ' ';
		}
		Element.className += Class;
		return Element;
	};
	
	_.RemoveClass = function(Element, Class){
		Element.className = Element.className.replace(_.ClassMatcher(Class), '');
		return Element;
	};
	
	_.HasClass = function(Element, Class){
		var RE = _.ClassMatcher(Class);
		return RE.test(Element.className);
	};
	
	_.ToggleClass = function(Element, Class){
		if(_.HasClass(Element, Class)){
			_.RemoveClass(Element, Class);
		} else {
			_.AddClass(Element, Class);
		}
		return Element;
	};
	
	_.GetChildByTagName = function(Node, TagName){
		var Children, Child, i;
		Child = null;
		Children = Node.children;
		i = Children.length;
		while(!!i){
			i -= 1;
			if(Children[i].nodeName.toLowerCase() === TagName.toLowerCase()){
				Child = Children[i];
			}
		}
		return Child;
	};

	_.AnimateHeight = function(Element, HeightTo, Duration, HeightFrom, Started){
		
		HeightFrom = typeof(HeightFrom) === 'undefined' ? parseFloat(Element.style.height) : HeightFrom;
		if(isNaN(HeightFrom)){
			HeightFrom = Element.clientHeight;
		}
		
		if(HeightFrom === HeightTo){
			Element.style.height = HeightTo + 'px';
			return;
		}
		
		var CurrentDate, Elapsed;
		CurrentDate = Date.now();
		Started = typeof(Started) === 'undefined' ? CurrentDate : Started;
		Elapsed = CurrentDate - Started;
		
		Element.style.height = (HeightFrom + (Math.min(Elapsed / Duration, 1) * (HeightTo - HeightFrom))) + 'px';
		
		if(Elapsed >= Duration){
			Element.style.height = !!HeightTo ? 'auto' : (HeightTo + 'px');
		} else {
			setTimeout(function(){
				_.AnimateHeight(Element, HeightTo, Duration, HeightFrom, Started);
			}, 1000/64);
		}
	};
	
	_.SlideDown = function(Element, Duration){
		var HeightTo;
		Element.style.height = 'auto';
		HeightTo = Element.clientHeight;
		Element.style.height = '0px';
		_.AnimateHeight(Element, HeightTo, Duration, 0);
	};
	
	_.SlideUp = function(Element, Duration){
		var HeightFrom;
		Element.style.height = 'auto';
		HeightFrom = Element.clientHeight;
		_.AnimateHeight(Element, 0, Duration, HeightFrom);
	};
	
	_.CreateTreeView = function(Tree){
		
		var __ = this;
	
		__.HitAreaClicked = function(event){
			event.preventDefault();
			event.stopImmediatePropagation();
			
			var Target, Child;
			
			Target = event.target;
			Child = _.GetChildByTagName(Target.parentNode, 'ul');
			
			if(!!Child){
			
				var Parent = Target.parentNode;
				if(_.HasClass(Parent, 'open')){
					_.SlideUp(Child, 200);
					setTimeout(function(){
						_.RemoveClass(Parent, 'open');
					}, 200);
				} else {
					_.SlideDown(Child, 200);
					_.AddClass(Parent, 'open');
				}
			}
		};
		
		__.CreateHitArea = function(Node){
			var HitArea;
			HitArea = document.createElement('a');
			HitArea.className = 'hit';
			if(!!_.GetChildByTagName(Node, 'ul')){
				HitArea.className += ' expandable';
			}
			HitArea.href = '#';
			HitArea.addEventListener('click', __.HitAreaClicked);
			HitArea.addEventListener('tap', __.HitAreaClicked);
			Node.insertBefore(HitArea, Node.firstChild);
			return HitArea;
		};
		
		__.ProcessNode = function(Node){
			var Children, i;
			Children = Node.children;
			if(Node.nodeName.toLowerCase() === 'li'){
				__.CreateHitArea(Node);
			}
			i = Children.length;
			while(!!i){
				i -= 1;
				__.ProcessNode(Children[i]);
			}
		};
		_.AddClass(Tree, 'treeview');
		__.ProcessNode(Tree);
	};
	
	_.Initialise = function(){
		var Forest = document.querySelectorAll(Selector);
		var Trees = Forest.length;
		while(!!Trees){
			Trees -= 1;
			_.CreateTreeView(Forest[Trees]);
		}
	};
	
	_.Initialise();
	
};