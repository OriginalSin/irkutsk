var nsGmx = nsGmx || {};

(function($){
    
var translations = window.language === 'rus' ?
	{
		ExtendedViewTitle: 'Выбор периода',
		MinimalViewTitle:  'Свернуть',
		UTC:               'Всемирное координированное время'
	} :
	{
		ExtendedViewTitle: 'Period selection',
		MinimalViewTitle:  'Minimize',
		UTC:               'Coordinated Universal Time'
	};

/** Параметры календаря
 * @typedef nsGmx.Calendar~Parameters
 * @property {Date} [dateMin] минимальная граничная дата для календарей, null - без ограничений
 * @property {Date} [dateMax] максимальная граничная дата для календарей, null - без ограничений
 * @property {String} [dateFormat='dd.mm.yy'] формат даты
 * @property {bool} [minimized=true] показывать ли минимизированный или развёрнутый виджет в начале
 * @property {bool} [showSwitcher=true] показывать ли иконку для разворачивания/сворачивания периода
 * @property {Date} [dateBegin=<текущая дата>] начальная дата интервала
 * @property {Date} [dateEnd=<текущая дата>] конечная дата интервала
 * @property {bool} [showTime=false] показывать ли время
 * @property {String} [container] куда добавлять календарик
 * @property {String} [buttonImage] URL иконки для активации календариков
 */

/** Контрол для задания диапазона дат. Даты календарика всегда в UTC, а не в текущем поясе.
 @alias nsGmx.Calendar
 @class
 @param {String} name Имя календаря
 @param {nsGmx.Calendar~Parameters} params Параметры календаря
*/
var Calendar = function(name, params)
{
    /** Сформированный DOM node с виджетом. Нужно использовать, если не указан параметр `container` в {@link nsGmx.Calendar~Parameters}
     * @memberOf nsGmx.Calendar.prototype
     * @member {DOMNode} canvas
    */
    this.canvas = null;

    this._visModeController = (function()
    {
        var publicInterface = {
            SIMPLE_MODE: 1,
            ADVANCED_MODE: 2,
            getMode: function() 
            { 
                return curMode; 
            },
            setMode: function(mode) { 
                curMode = mode;
                $(this).triggerHandler('change');
            },
            toggleMode: function() 
            {
                this.setMode(curMode === this.SIMPLE_MODE ? this.ADVANCED_MODE : this.SIMPLE_MODE );
            }
        }
        
        var curMode = publicInterface.SIMPLE_MODE;
        
        return publicInterface;
    })();

    /** Если изменилась хотя бы одна из дат
      @name nsGmx.Calendar.change
      @event
     */
     
    /** Синоним для события change
      @name nsGmx.Calendar.datechange
      @event
     */
     
    this.dateBegin = null;
    this.dateEnd = null;

    this.lazyDate = null;

    this.lazyDateInited = false;

    this._timeBegin = { hours: 0, minutes: 0, seconds: 0 };
    this._timeEnd   = { hours: 0, minutes: 0, seconds: 0 };

    if (typeof name !== 'undefined')
        this.init(name, params);
}

//public interface

/** Получить начальную дату
 * @return {Date} начальная дата
 */
Calendar.prototype.getDateBegin = function()
{
    var date = Calendar.fromUTC($(this.dateBegin).datepicker("getDate"));
    
    if (date)
    {
        date.setUTCHours(this._timeBegin.hours);
        date.setUTCMinutes(this._timeBegin.minutes);
        date.setUTCSeconds(this._timeBegin.seconds);
    }
    return date;
}
    
/** Получить конечную дату
 * @return {Date} конечная дата
 */
Calendar.prototype.getDateEnd = function() 
{
    var date = Calendar.fromUTC($(this.dateEnd).datepicker("getDate"));
    if (date)
    {
        date.setUTCHours(this._timeEnd.hours);
        date.setUTCMinutes(this._timeEnd.minutes);
        date.setUTCSeconds(this._timeEnd.seconds);
    }
    return date;
}

/** Установить начальную дату периода
 * @param {Date} date Начальная дата
 */
Calendar.prototype.setDateBegin = function(date, keepSilence)
{
    if (date)
    {
        this._timeBegin.hours = date.getUTCHours();
        this._timeBegin.minutes = date.getUTCMinutes();
        this._timeBegin.seconds = date.getUTCSeconds();
    }
    $(this.dateBegin).datepicker("setDate", Calendar.toUTC(date));
    keepSilence || this._triggerChange();
}

/** Установить конечную дату периода
 * @param {Date} date Конечная дата
 */
Calendar.prototype.setDateEnd = function(date, keepSilence)
{
    if (date)
    {
        this._timeEnd.hours = date.getUTCHours();
        this._timeEnd.minutes = date.getUTCMinutes();
        this._timeEnd.seconds = date.getUTCSeconds();
    }
    
    $(this.dateEnd).datepicker("setDate", Calendar.toUTC(date));
    keepSilence || this._triggerChange();
}

/** Установить даты периода
 * @param {Date} dateBegin Начальная дата
 * @param {Date} dateEnd Конечная дата
 */
Calendar.prototype.setDates = function(dateBegin, dateEnd) {
    this.setDateBegin(dateBegin, true);
    this.setDateBegin(dateEnd);
}

/** Получить верхнюю границу возможных дат периода
 * @return {Date} верхняя граница возможных периодов
 */
Calendar.prototype.getDateMax = function() { return this.dateMax; }

/** Получить нижнуюю границу возможных дат периода
 * @return {Date} нижняя граница возможных периодов
 */
Calendar.prototype.getDateMin = function() { return this.dateMin; }

/** Установить нижнуюю границу возможных дат периода
 * @param {Date} dateMin нижняя граница возможных периодов
 */
Calendar.prototype.setDateMin = function(dateMin)
{
    this.dateMin = dateMin;
    $([this.dateBegin, this.dateEnd]).datepicker('option', 'minDate', dateMin ? Calendar.toUTC(dateMin) : null);
}

/** Установить верхнюю границу возможных дат периода
 * @param {Date} dateMax верхняя граница возможных периодов
 */
Calendar.prototype.setDateMax = function(dateMax)
{
    this.dateMax = dateMax;
    if (dateMax) {
        var utcDate = Calendar.toUTC(dateMax);
        utcDate.setHours(23);
        utcDate.setMinutes(59);
        utcDate.setSeconds(59);
        $([this.dateBegin, this.dateEnd]).datepicker('option', 'maxDate', utcDate);
    } else {
        $([this.dateBegin, this.dateEnd]).datepicker('option', 'maxDate', null);
    }
}

/** Нужно ли показывать время под календариком
 * @param {Boolean} isShowTime Показывать ли время
 */
Calendar.prototype.setShowTime = function(isShowTime)
{
    this._params.showTime = isShowTime;
    this._updateInfo();
}

/** Сериализация состояния виджета
 * @return {Object} Сериализованное состояние
 */
Calendar.prototype.saveState = function()
{
    return {
        dateBegin: this.getDateBegin().valueOf(),
        dateEnd: this.getDateEnd().valueOf(),
        lazyDate: this.lazyDate,
        vismode: this._visModeController.getMode()
    }
}

/** Восстановить состояние виджета по сериализованным данным
 * @param {Object} data Сериализованное состояние календарика
 */
Calendar.prototype.loadState = function( data )
{
    $(this.dateBegin).datepicker("setDate", Calendar.toUTC(new Date(data.dateBegin)));
    $(this.dateEnd).datepicker("setDate", Calendar.toUTC(new Date(data.dateEnd)));
    this.lazyDate = data.lazyDate;
    this._visModeController.setMode(data.vismode);
}

/**
 * @function
 */
Calendar.prototype.setTimeBegin = function( hours, minutes, seconds )
{
    this._timeBegin = {
        hours: hours,
        minutes: minutes,
        seconds: seconds
    }
    
    this._updateInfo();
}

/**
 * @function
 */
Calendar.prototype.setTimeEnd = function( hours, minutes, seconds )
{
    this._timeEnd = {
        hours: hours,
        minutes: minutes,
        seconds: seconds
    }
    
    this._updateInfo();
}

Calendar.prototype.setLazyDate = function(lazyDate, keepSilence)
{
    this.lazyDate = lazyDate;
    var prevDate = this.getDateBegin();
    this._updateBegin();
    var newDate = this.getDateBegin();
    
    if ( !keepSilence && prevDate.valueOf() !== newDate.valueOf() ) {
        this._triggerChange();
    }
}

Calendar.prototype.getModeController = function() {
    return this._visModeController;
}

Calendar.prototype.setSwitcherVisibility = function(isVisible) {
    this.moreIcon && $(this.moreIcon).toggle(isVisible);
}

Calendar.fromUTC = function(date)
{
    if (!date) return null;
    var timeOffset = date.getTimezoneOffset()*60*1000;
    return new Date(date.valueOf() - timeOffset);
}

Calendar.toUTC = function(date)
{
    if (!date) return null;
    var timeOffset = date.getTimezoneOffset()*60*1000;
    return new Date(date.valueOf() + timeOffset);
}

function f(n) {
    return n < 10 ? '0' + n : n;
}

function getStr (time) {
    return f(time.hours) + ":" + f(time.minutes) /*+ ":" + f(time.seconds)*/
};

Calendar.prototype._updateInfo = function()
{
    if (!this._params.showTime) {
        $('#dateBeginInfo, #dateEndInfo', this.canvas).empty();
        return;
    }
    
    $('#dateBeginInfo', this.canvas).text(getStr( this._timeBegin ) + " (UTC)").attr('title', translations.UTC);
    $('#dateEndInfo'  , this.canvas).text(getStr( this._timeEnd ) + " (UTC)").attr('title', translations.UTC);
}

/**
 * Инициализирует календарь.
 * @function
 * @param {String} name Имя календаря
 * @param {nsGmx.Calendar~Parameters} params Параметры календаря
 */
Calendar.prototype.init = function( name, params )
{
    var _this = this;
    this._name = name;

    this._params = $.extend({
        minimized: true,
        showSwitcher: true,
        showTime: false,
        dateMax: null,
        dateMin: null,
        dateFormat: 'dd.mm.yy'
    }, params)

    this.dateMin = this._params.dateMin;
    this.dateMax = this._params.dateMax;

    if (this.dateMax) {
        this.dateMax.setHours(23);
        this.dateMax.setMinutes(59);
        this.dateMax.setSeconds(59);
    };

    this.lazyDate = this._params.periodDefault || (this._params.minimized ? 'day': '');

    this._visModeController.setMode(this._params.minimized ? this._visModeController.SIMPLE_MODE : this._visModeController.ADVANCED_MODE);

    var cont = L.DomUtil.create('div', 'calendarContainer'),
        items = {
            moreIconClass: this._params.minimized ? 'icon-calendar' : 'icon-calendar-empty',
            moreIconTitle: this._params.minimized ? translations.ExtendedViewTitle : translations.MinimalViewTitle,
            name: this._name
        };
	cont.innerHTML = '\
		<div id = "calendar" class = "CalendarWidget ui-widget"><table>\
			<tr>\
				<td><div class = "CalendarWidget-iconScrollLeft ui-helper-noselect icon-left-open"></div></td>\
				<td class = "CalendarWidget-inputCell"><input class = "gmx-input-text CalendarWidget-dateBegin"></td>\
				<td class = "CalendarWidget-inputCell CalendarWidget-onlyMaxVersion"><input class = "gmx-input-text CalendarWidget-dateEnd"></td>\
				<td><div class = "CalendarWidget-iconScrollRight ui-helper-noselect icon-right-open" ></div></td>\
				<td><div class = "CalendarWidget-iconMore '+items.moreIconClass+'" title = "'+items.moreIconTitle+'"></div></td>\
			</tr><tr>\
				<td></td>\
				<td id = "dateBeginInfo" class = "CalendarWidget-onlyMaxVersion CalendarWidget-dateBeginInfo"></td>\
				<td id = "dateEndInfo" class = "CalendarWidget-onlyMaxVersion CalendarWidget-dateEndInfo"></td>\
				<td></td>\
				<td></td>\
			</tr>\
		</table></div>';
    this.canvas = $(cont);
	
    // this.canvas = $(Handlebars.compile(nsGmx.Templates.CalendarWidget.CalendarWidget)(
        // {
            // moreIconClass: this._params.minimized ? 'icon-calendar' : 'icon-calendar-empty',
            // moreIconTitle: this._params.minimized ? translations.ExtendedViewTitle : translations.MinimalViewTitle,
            // name: this._name
        // }
    // ));

    this.moreIcon = this.canvas.find('.CalendarWidget-iconMore')
                    .click(this._visModeController.toggleMode.bind(this._visModeController))
                    .toggle(!!this._params.showSwitcher)[0];
                    
    this.first = this.canvas.find('.CalendarWidget-iconScrollLeft').click(this._firstClickFunc.bind(this))[0];
    this.last = this.canvas.find('.CalendarWidget-iconScrollRight').click(this._lastClickFunc.bind(this))[0];

    this.dateBegin = this.canvas.find('.CalendarWidget-dateBegin')[0];
    this.dateEnd = this.canvas.find('.CalendarWidget-dateEnd')[0];

    $([this.dateBegin, this.dateEnd]).datepicker(
    {
        onSelect: function(dateText, inst) 
        {
            _this._selectFunc(inst);
            _this._updateInfo();
            _this._triggerChange();
        },
        showAnim: 'fadeIn',
        changeMonth: true,
        changeYear: true,
        minDate: this.dateMin ? Calendar.toUTC(this.dateMin) : null,
        maxDate: this.dateMax ? Calendar.toUTC(this.dateMax) : null,
        dateFormat: this._params.dateFormat,
        defaultDate: Calendar.toUTC(this.dateMax || new Date()),
        showOn: this._params.buttonImage ? 'both' : 'focus',
        buttonImageOnly: true
    });

    //устанавливаем опцию после того, как добавили календарик в canvas
    if (this._params.buttonImage) {
        $([this.dateBegin, this.dateEnd]).datepicker('option', 'buttonImage', this._params.buttonImage);
    }

    $(this._visModeController).change(function()
    {
        var isSimple = _this._visModeController.getMode() === _this._visModeController.SIMPLE_MODE;
        $(".CalendarWidget-onlyMaxVersion", _this.canvas).toggle(!isSimple);
        
        _this.setLazyDate(isSimple ? 'day' : '', true);
        _this._triggerChange(); //всегда генерим событие, так как в целом состояние календаря изменилось
        
        $(_this.moreIcon)
            .toggleClass('icon-calendar', isSimple)
            .toggleClass('icon-calendar-empty', !isSimple)
            .attr('title', isSimple ? translations.ExtendedViewTitle : translations.MinimalViewTitle);
    });

    $(".CalendarWidget-onlyMaxVersion", this.canvas).toggle(!this._params.minimized);

    var curUTCDate = new Date((new Date()).valueOf() + (new Date()).getTimezoneOffset()*60*1000);

    if (typeof this._params.dateEnd === 'undefined')
        $(this.dateEnd).datepicker("setDate", curUTCDate);
    else
        $(this.dateEnd).datepicker("setDate", this._params.dateEnd);

    if (typeof this._params.dateBegin === 'undefined')
        //если не выбран период, то по умолчанию мы устанавливаем одинаковые даты
        $(this.dateBegin).datepicker("setDate", this.lazyDate === '' ? curUTCDate : this._getBeginByEnd() );
    else
        $(this.dateBegin).datepicker("setDate", this._params.dateBegin );

    if (this._params.container)
    {
        if (typeof this._params.container === 'string')
            $('#' + this._params.container).append(this.canvas);
        else
            $(this._params.container).append(this.canvas);
    }

    this._updateInfo();
}

Calendar.prototype._fixDate = function(date)
{
    if (date) 
        date.setHours(12);

    return date;
}

Calendar.prototype._fixDay = function(day)
{
    if (day == 0)
        return 6;
    else
        return day - 1;
}

Calendar.prototype._daysAtMonth = function(month, year)
{
    var leap = ( ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0) ) ? 1 : 0,
        days = [31, 28 + leap, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    return days[month - 1];
}

Calendar.prototype._getBeginByEnd = function(endDate)
{
    var end = endDate ? endDate : $(this.dateEnd).datepicker("getDate");
    
    if (!end) return null;
    
    this._fixDate(end)
    
    switch(this.lazyDate)
    {
        case '':
            return $(this.dateBegin).datepicker("getDate");
        case 'day': 
            return end;
        case 'week':
            return new Date(end.valueOf() - this._fixDay(end.getDay()) * 24 * 3600 * 1000);
        case 'month': 
            return new Date(end.getFullYear(), end.getMonth(), 1, 12, 0, 0);
        case 'year':
            return new Date(end.getFullYear(), 0, 1, 12, 0, 0)
    }
}

Calendar.prototype._getEndByBegin = function(beginDate)
{
    var begin = beginDate ? beginDate : $(this.dateBegin).datepicker("getDate");
    
    if (!begin) return null;
    
    this._fixDate(begin)
    
    switch(this.lazyDate)
    {
        case '':
            return $(this.dateEnd).datepicker("getDate");
        case 'day': 
            return begin;
        case 'week':
            return new Date(begin.valueOf() + (6 - this._fixDay(begin.getDay())) * 24 * 3600 * 1000);
        case 'month': 
            return new Date(begin.getFullYear(), begin.getMonth(), this._daysAtMonth(begin.getMonth() + 1, begin.getFullYear()), 12, 0, 0);
        case 'year':
            return new Date(begin.getFullYear(), 11, 31, 12, 0, 0)
    }
}

Calendar.prototype._updateBegin = function()
{
    $(this.dateBegin).datepicker("setDate", this._getBeginByEnd());
}

Calendar.prototype._updateEnd = function()
{
    $(this.dateEnd).datepicker("setDate", this._getEndByBegin());
}

Calendar.prototype._firstClickFunc = function()
{
    var begin = $(this.dateBegin).datepicker("getDate"),
        end = $(this.dateEnd).datepicker("getDate"),
        newDateBegin,
        newDateEnd;
        
    if (!begin || !end) return;
    
    this._fixDate(begin);
    this._fixDate(end);

    if (this.lazyDate == '')
    {
        var period = end.valueOf() - begin.valueOf();
        
        newDateBegin = new Date(begin.valueOf() - 1000*60*60*24);
        newDateEnd = new Date(begin.valueOf() - 1000*60*60*24 - period);
        
        if (this.dateMin && newDateBegin < this.dateMin)
            return;
        
        $(this.dateEnd).datepicker("setDate", newDateBegin);
        $(this.dateBegin).datepicker("setDate", newDateEnd);
    }
    else
    {
        newDateEnd = new Date(begin.valueOf() - 1000*60*60*24);
        newDateBegin = this._getBeginByEnd(newDateEnd);
        
        if (this.dateMin && newDateBegin < this.dateMin)
        {
            return;
        }
        
        $(this.dateEnd).datepicker("setDate", newDateEnd);
        
        this._updateBegin();
    }
    
    this._triggerChange();
}

Calendar.prototype._lastClickFunc = function()
{
    var begin = $(this.dateBegin).datepicker("getDate"),
        end = $(this.dateEnd).datepicker("getDate"),
        newDateBegin,
        newDateEnd;
        
    if (!begin || !end) return;

    this._fixDate(begin);
    this._fixDate(end);

    if (this.lazyDate == '')
    {
        var period = end.valueOf() - begin.valueOf();
        
        newDateBegin = new Date(end.valueOf() + 1000*60*60*24);
        newDateEnd = new Date(end.valueOf() + 1000*60*60*24 + period);
        
        if (this.dateMax && newDateEnd > this.dateMax)
            return;
        
        $(this.dateBegin).datepicker("setDate", newDateBegin);
        $(this.dateEnd).datepicker("setDate", newDateEnd);
    }
    else
    {
        newDateBegin = new Date(end.valueOf() + 1000*60*60*24);
        newDateEnd = this._getBeginByEnd(newDateBegin);
        
        if (this.dateMax && newDateEnd > this.dateMax)
        {
            return;
        }
        
        $(this.dateBegin).datepicker("setDate", newDateBegin);
        
        this._updateEnd();
    }

    this._triggerChange();
}

Calendar.prototype._selectFunc = function(inst)
{
    if (this.lazyDate != '')
    {
        if (inst.input[0] == this.dateEnd)
            this._updateBegin();
        else
            this._updateEnd();
    }
    else {
        var begin = $(this.dateBegin).datepicker("getDate");
        var end   = $(this.dateEnd).datepicker("getDate");
        
        if ( end && begin > end )
        {
            var dateToFix = inst.input[0] == this.dateEnd ? this.dateBegin : this.dateEnd;
            $(dateToFix).datepicker( "setDate", $(inst.input[0]).datepicker("getDate") );
        }
    }
};

Calendar.prototype._triggerChange = function() {
    $(this).triggerHandler('change');
    $(this).triggerHandler('datechange'); //для совместимости с некоторыми внешними приложениями
}

nsGmx.CalendarWidget = Calendar;

})(jQuery);