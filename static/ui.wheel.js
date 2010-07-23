/*
 * jQuery UI Wheel
 *
 * Copyright (c) 2009 sompylasar (maninblack.msk@hotmail.com ; http://maninblack.info/)
 * Licensed under the MIT (MIT-LICENSE.txt)
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/**
 * jQuery UI Wheel
 *
 * Depends on:
 * jQuery v1.3.2:
 *   jquery-1.3.2.js
 * jQuery UI v1.7.2:
 *	 ui.core.js
 *	 ui.draggable.js
 *   ui.core.css
 *   ui.theme.css
 *   ui.wheel.css
 */

(function ($) {
	var _2PI = 2*Math.PI;
	
	$.widget('ui.wheel', {
	    _init: function () { 
	        if (!this.element.is('input[type=text]')) throw 'Elements other than input[type=text] are not supported.';
	        
	        this._extend();
	    },
		_setData: function (key, value) {
			if (key == 'value') { this._setInputValue(value); return; }
			this.options[key] = value;
			
			
			if (/min|max|anglespan|angleoffset|radius|precision|format|constraint/.test(key)) {
				this._setInputValue(this.options.value);
				this._updateValueText();
				this._updateKnobPosition();
					
			}
			else if (key == 'stream') this._stream(this.options.stream);
			else if (key == 'disabled') this._disabled(value);
			else if (key == 'textvisible' || key == 'texteditable') this._updateState();
			else if (key == 'background') { 
				var img = this.div.find('img');
				if (value) { img.removeClass('ui-helper-hidden'); this.div.addClass('ui-wheel-with-background'); }
				else { img.addClass('ui-helper-hidden'); this.div.removeClass('ui-wheel-with-background'); }
				img.attr('src', value);
			}
		},
		//_state: function (state) {
		//    alert(state);
		//    return state;
		//},		
		_stream: function (stream) {
		    return stream;
		},
		
		enable: function () {
		    this._disabled(false);
		},
		disable: function () {
		    this._disabled(true);
		},
		repaint: function () {
		    this._updateKnobPosition();
			this._updateState();
		},
		originalElement: function () {
			return this.element;
		},
		destroy: function () {
			var empty = $([]);
			var input = this.input || empty, div = this.div || empty, knob = this.knob || empty, background = this.background || empty;
			var widgetClassName = this.widgetBaseClass;
			
			$.data(div[0], this.widgetName, null);
			
			div.add(input).add(knob).add(background).unbind('.'+widgetClassName);
			knob.draggable('destroy');
			input.removeClass('ui-widget-content');
			div.after(input).remove();
			
			$.widget.prototype.destroy.apply(this, arguments);
		},
		
		_map: function(value, min, max, ostart, ostop) {
			
		        return Math.round(ostart + (ostop - ostart) * ((value - istart) / (istop - istart)));

		   
		},
		_disabled: function (disabled) {
			if (typeof disabled != 'undefined') {
		        this.input.attr('disabled', !!disabled); 
		        this._updateState();
		        return this.element;
			}
			else return this.input.attr('disabled');
		},
		_roundTo: function (floatvalue, precision) {
			floatvalue = parseFloat(floatvalue);
			if (isNaN(floatvalue)) return floatvalue;
			var mul = Math.pow(10, precision);
			return Math.round(floatvalue * mul) / mul;
		},
		_constrainValue: function (value) {
			var o = this.options, min = o.min, max = o.max;
			var value = parseFloat(value);
			
			if ($.isFunction(o.constraint)) value = o.constraint(value);
			
			if (isNaN(value)) return this.options.value;
			
			if (value > max) value = max;
			if (value < min) value = min;
				
			value = this._roundTo(value, o.precision);
			
			return value;
		},
		_formatValue: function (value) {
			return ($.isFunction(this.options.format) 
				? this.options.format(value) 
				: typeof format == 'string' 
					? format.replace('#{value}', value) 
					: (''+value));
		},
		_toggleDisabled: function () {
			return this._disabled( ! this._disabled() );
		},
		_updateBackground: function (value,min,max) {

			var mapped =  (360) * ((value - min) / (max - min));
			
			$(this.background).css({
			    'transform': 'rotate('+(-mapped)+'deg)',
			    '-moz-transform': 'rotate('+(-mapped)+'deg)',
			    '-o-transform': 'rotate('+(-mapped)+'deg)',
			    '-webkit-transform': 'rotate('+(-mapped)+'deg)'
			})
			
		},
		
		_calcKnobPosition: function (value) {
						
			var o = this.options, min = o.min, max = o.max;
			if (typeof value == 'undefined') value = this.input.val();
			value = this._constrainValue(value);
		
			var x = parseInt(this.knob.css('left')), y = parseInt(this.knob.css('top'));
			if (!isNaN(value)) {
				var kw = this.knob.width() / 2, kh = this.knob.height() / 2,
					w = this.div.width() / 2 , h = this.div.height() / 2;
				var r = Math.max(o.radius !== false ? o.radius : 3*(w < h ? w : h)/4, Math.min(w-kw,h-kh)), 
					
					a = (o.anglespan * _2PI / 360) * (value - min) / (max - min) + (o.angleoffset * _2PI / 360);
				
					x = r*Math.cos(a) - kw + w; 
	      			y = h - (r*Math.sin(a) + kh);
					
					
				
			
				this._updateBackground(value,min,max);
			}
		
	
			return { left: x, top: y };
		},
		_updateKnobPosition: function (value) {
			this.knob.css( this._calcKnobPosition(value) );

		},
		
		_calcInputValue: function (position, isMouse) {
			var o = this.options, min = o.min, max = o.max;
			if (!position) position = { left: parseInt(this.knob.css('left')), top: parseInt(this.knob.css('top')) };
			
			
			var x = position.left, y = position.top;
			var kw = this.knob.width() / 2, kh = this.knob.height() / 2,
				w = this.div.width() / 2, h = this.div.height() / 2;
				
			var a = Math.atan2(h - (y + (isMouse ? 0 : kh)), x + (isMouse ? 0 : kw) - w); 
			
			while (a < 0) a += _2PI;
			var value = ((a - o.angleoffset * _2PI / 360) / (o.anglespan * _2PI / 360)) * (max - min) + min;
			value = this._constrainValue(value);
			return (value);

		},
		_updateValueText: function (value,max) {
			if (typeof value == 'undefined') value = this.input.val();
			this.text.text(this._formatValue(value));
		},
		_setupUnselectable: function () {
			var widgetClassName = this.widgetBaseClass;
			this.text.attr('unselectable','on')
				.unbind('selectstart.'+widgetClassName+'').bind('selectstart.'+widgetClassName+'', function () { return false; });
		},
		_teardownUnselectable: function () {
			var widgetClassName = this.widgetBaseClass;
			this.text.removeAttr('unselectable')
				.unbind('selectstart.'+widgetClassName+'');
		},
		_setInputValue: function (value) {
			if (typeof value == 'undefined') value = this.input.val();
			var old_value = parseFloat(this.options.value);
			value = this._constrainValue(value);
			
			this._updateValueText(this.options.value);
			this._updateKnobPosition(this.options.value);
			
			if (value != old_value)
				try { if (false === this._trigger('change', {}, { value: value, old_value: old_value })) return false; } catch (e) {}
			
			this.options.value = value;
			this.input.val(value);
			
			this._updateValueText(value);
			this._updateKnobPosition(value);
			
		},
		_updateInputValue: function (position) {
			this._setInputValue(this._calcInputValue(position));
		},
	    _updateState: function () {
			var o = this.options;
			var widgetClassName = this.widgetBaseClass;
			
		    o.disabled = this._disabled();
			
			var disabled_change = (this.div.hasClass('ui-state-disabled') != o.disabled),
				disabled = (disabled_change && o.disabled), enabled = (disabled_change && !o.disabled),
				editing = this.div.hasClass(widgetClassName+'-editing');
			
			if (o.disabled) this.div.addClass('ui-state-disabled');
			else this.div.removeClass('ui-state-disabled');
			
			if (o.textvisible) this.text.removeClass('ui-helper-hidden');
			else this.text.addClass('ui-helper-hidden');
			
			if (!o.texteditable && editing) this._endEdit(true);
			
			if (disabled) {
				this._endEdit(true);
				this.knob.draggable('disable');
				this._setupUnselectable();
				
				try { this._trigger('disabled'); } catch (e) {}
			}
			else if (enabled) {
				this._teardownUnselectable();
				this.knob.draggable('enable');
				
				try { this._trigger('enabled'); } catch (e) {}
			}
		},
	
		
		_beginEdit: function () {
			var widgetClassName = this.widgetBaseClass;
			if (!this.div.hasClass(widgetClassName+'-editing')) {
				if (this.options.texteditable) {
					try { if (false === this._trigger('beginedit', {}, { value: this.options.value })) return false; } catch (e) {}
					
					this.div.addClass(widgetClassName+'-editing');
					
					this.input.focus();
				}
			}
		},
		_endEdit: function (cancel) {
			var widgetClassName = this.widgetBaseClass;
			if (this.div.hasClass(widgetClassName+'-editing')) {
				var value = (cancel ? this.options.value : this.input.val());
				
				try { if (false === this._trigger('endedit', {}, { value: this.options.value, cancel: cancel })) return false; } catch (e) {}
				
				this.div.removeClass(widgetClassName+'-editing');
				this.input.blur();
				
				this._setInputValue(value);
			}
		},
		_extend: function () {
	
			var o = this.options, min = o.min, max = o.max;
			
			var self = this;

	
			var input = this.input = this.element;
			var widgetClassName = this.widgetBaseClass;
			var div = this.div = $('<div class="ui-widget ui-corner-all '+widgetClassName+' ui-state-default"><div class="'+widgetClassName+'-wrapper">'
									+ '<a class="'+widgetClassName+'-knob ui-corner-all ui-icon ui-icon-radio-off"/>'
									+ '<img class="'+widgetClassName+'-background'+(o.background ? '' : ' ui-helper-hidden')+'" src="'+o.background+'" />'
									+ '<span class="ui-widget-content '+widgetClassName+'-text"></span>'
									+ '</div></div>');
			var knob = this.knob = div.find('a');
			var background = this.background = div.find('img');
			var text = this.text = div.find('span');
			
			input.addClass('ui-widget-content');
			
			div.insertBefore(input).find('div.'+widgetClassName+'-wrapper').append(input);
			
			$.data(div[0], this.widgetName, this);
			$(".ui-widget-content").css("top","0px");
			
			
			background
				.bind('mousedown.'+widgetClassName+'', function (event) { event.preventDefault(); }); // prevent dragging of img
				
			text
				.bind('click.'+widgetClassName+'', function (event) {
					event.stopPropagation();
				})
				.bind('dblclick.'+widgetClassName+'', function (event) {
					if (self._disabled()) return false;
					
					self._beginEdit();
				});
			
			knob
				.bind('mouseover mouseenter', function () { knob.addClass('ui-state-hover'); })
				.bind('mouseout mouseleave', function () { knob.removeClass('ui-state-hover'); })
				.draggable()
				.bind('dragstart.'+widgetClassName+'', function (event, ui) {
					try { if (false === self._trigger('dragstart', event, { value: self.options.value })) return false; } catch (e) {}
					
					div.addClass(widgetClassName+'-changing');
					knob.addClass('ui-state-hover').addClass('ui-state-active');
				})
				.bind('drag.'+widgetClassName+'', function (event, ui) {
					var value = self._calcInputValue(ui.position)
					
					try { self._trigger('drag', event, { value: value }); } catch (e) {}
					
					ui.position = self._calcKnobPosition(value);
					self._updateValueText(value);
					
			
					
						
				})
				.bind('dragstop.'+widgetClassName+'', function (event, ui) {
				
					var value = self._calcInputValue(ui.position);
							
							updateAnalog(value,self.options.stream);

					
					var ret;
					try { ret = self._trigger('dragstop', event, { value: value }); } catch (e) {}
					
					div.removeClass(widgetClassName+'-changing');
					knob.removeClass('ui-state-hover').removeClass('ui-state-active');
					
					self._updateInputValue(self._calcKnobPosition( (false === ret ? self.options.value : self._calcInputValue(ui.position)) ));
				});
				
			div
				.bind('click.'+widgetClassName+'', function (event) { 
					if (self._disabled()) return false;
					
					if (div.hasClass(widgetClassName+'-editing')) {
						if (event.target == input[0]) return;
						self._endEdit();
					}
					else {
						var x = event.pageX - this.offsetLeft;
						var y = event.pageY - this.offsetTop;
						self._updateInputValue(self._calcKnobPosition(self._calcInputValue({ left: x, top: y }, true)));
					}
					self._updateKnobPosition();
				});
			
			input
			    .bind('change.'+widgetClassName+'', function (event) { 
					input.val(self._constrainValue(input.val()));
					
					self._updateValueText();
					self._updateKnobPosition();
			    })
				.bind('focus.'+widgetClassName+'', function(){
					if (!div.hasClass('ui-state-focus')) {
						div.addClass('ui-state-focus');
					
						try { self._trigger('focus'); } catch (e) {}
					}
				})
				.bind('blur.'+widgetClassName+'', function(){ 
					if (div.hasClass('ui-state-focus')) {
						div.removeClass('ui-state-focus');
						self._endEdit();
						
						try { self._trigger('blur'); } catch (e) {}
					}
				})
				.bind('keypress.'+widgetClassName+'', function (event) {
					if (event.keyCode == 27) { // ESCAPE
						self._endEdit(true);
					}
				});
				
			this._disabled(o.disabled);
			
			var value = input.val();
			if (isNaN(parseFloat(value))) {
				if (o.value !== false) value = o.value;
				else value = min;
			}
			

			this._setInputValue(value);
			this._updateState();
		}
	});
	$.extend($.ui.wheel, {
		version: '1.7.2',
		eventPrefix: 'ui-wheel-',
		defaults: {
			angleoffset: 0,
			anglespan: 360,
			background: '',
			format: false,
			constraint: false,
			disabled: false,
			min: 0,
			precision: 0,
			radius: false,
			textvisible: true,
			texteditable: true,
			value: false
		},
		getter: 'originalElement'
	});
})(jQuery);