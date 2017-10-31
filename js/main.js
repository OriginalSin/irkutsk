var map = new L.Map(document.body.getElementsByClassName('map')[0], {
	layers: [],
	//crs: L.CRS.EPSG3395,
	center: new L.LatLng(53.08, 106.12),
	attributionControl: true,
	zoomControl: true,
	scrollWheelZoom: true,
	zoom: 4
});

var firesOverlay = L.featureGroup([])
    .bindPopup('Hello world!')
    .on('click', function() { alert('Clicked on a member of the group!'); });

var protocol = location.protocol === 'file:' ? 'http:' : location.protocol,
	baseLayers = {
		'Карта': L.tileLayer(protocol + '//tilessputnik.ru/{z}/{x}/{y}.png'),
		'Спутник': L.tileLayer(protocol + '//maps.kosmosnimki.ru/TileService.ashx?LayerName=C598DBF5726945AFBEC937E086447DBF&map=5AE44B9616754357B39802C0620B2713&crs=epsg:3857&request=getTile&apiKey=6Q81IXBUQ7&z={z}&x={x}&y={y}')
	},
	overlayes = {
		'Пожары': firesOverlay,
		'Граница Иркутской обл.': L.geoJSON(irk)
	};

baseLayers['Карта'].addTo(map);
L.control.layers(baseLayers, overlayes).addTo(map);

if (location.search.indexOf('irk=1') !== -1) {
	overlayes['Граница Иркутской обл.'].addTo(map);
}

// nsGmx.GmxWidgetMixin = {
var gmxWidgetMixin = {
    getContainer: function() {
        return this.el || this._container;
    },
    appendTo: function(el) {
        el = el[0] || el;
        el.appendChild(this.getContainer());
    },
    show: function() {
        var el = this.getContainer();
        el.style.display = (this._previousStyleDisplayValue !== 'none' && this._previousStyleDisplayValue) || 'block';
        delete this._previousStyleDisplayValue;
    },
    hide: function() {
        var el = this.getContainer();
        this._previousStyleDisplayValue = el.style.display;
        el.style.display = 'none';
    },
    _terminateMouseEvents: function(el) {
        el = el || this.getContainer();
        L.DomEvent.disableClickPropagation(el);
        el.addEventListener('mousewheel', L.DomEvent.stopPropagation);
        el.addEventListener('mousemove', L.DomEvent.stopPropagation);
    }
};

var CalendarContainerControl = L.Control.extend({
	includes: [gmxWidgetMixin, L.Evented ? L.Evented.prototype : L.Mixin.Events],
	onAdd: function(map) {
		var container = this._container = L.DomUtil.create('div', 'calendarContainerControl');
		container.id = 'calendar';
		this._terminateMouseEvents();

		L.DomUtil.addClass(container, 'calendarContainer_desktop');

		L.DomEvent.addListener(container, 'click', function() {
			this.fire('click');
		}, this);

		return container;
	},

	addView: function(view) {
		this._container.appendChild(view.el);
		return this;
	}
});

var calendarContainerControl = new CalendarContainerControl({
	position: 'topleft'
});

map.addControl(calendarContainerControl);

var dateBegin = new Date(Date.UTC(2011, 7, 10)),
	dateEnd = new Date(Date.UTC(2011, 7, 20));

var calendar = new nsGmx.CalendarWidget('calendarContainer', {
	container: 'calendar',
	dateFormat: 'mm-dd-yy',
	dateMin: new Date(Date.UTC(2011, 7, 1)),
	dateMax: new Date(Date.UTC(2011, 7, 31)),
	dateBegin: dateBegin,
	dateEnd: dateEnd,
	minimized: false,
	showSwitcher: true,
	showTime: true
});

$(calendar).on('change', function() {
	console.log('change', calendar.getDateBegin(), calendar.getDateEnd());
});

$(calendar).on('datechange', function() {
	console.log('datechange', calendar.getDateBegin(), calendar.getDateEnd());
});

var getItems = function(beg, end) {
	// http://sender.kosmosnimki.ru/irk-fires/hotspots/1509235200/1509321600?bbox={%22type%22:%22Polygon%22,%22coordinates%22:[[[83.671875,48.922499263758255],[83.671875,64.848937263579472],[122.958984375,64.848937263579472],[122.958984375,48.922499263758255],[83.671875,48.922499263758255]]]}
};

// firesOverlay
