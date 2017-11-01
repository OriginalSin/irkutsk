var curDate = new Date(Date.now());

var dateBegin = new Date(Date.UTC(curDate.getFullYear(), curDate.getMonth(), curDate.getDate())),
	dateEnd = new Date(dateBegin.getTime() + 1000*60*60*24);

// L.Icon.Default = L.Icon.Default.extend({
	// options: {
		// iconUrl: 'fire.png'
	// }
// });
	
var map = new L.Map(document.body.getElementsByClassName('map')[0], {
	layers: [],
	attributionControl: true,
	zoomControl: true,
	scrollWheelZoom: true,
	center: new L.LatLng(56.304348, 105.84228),
	zoom: 6
});
map.zoomControl.setPosition('bottomleft');

var firesOverlay = L.featureGroup([])
    .bindPopup('Hello world!')
    .on('click', function() { alert('Clicked on a member of the group!'); });

var currentBbox = null;
var getItems = function(beg, end) {
	dateBegin = beg || dateBegin;
	dateEnd = end || dateEnd;
// console.log(beg, end, currentBbox);
	var url = '//sender.kosmosnimki.ru/irk-fires/hotspots';
	url += '/' + parseInt(dateBegin.getTime() / 1000);
	url += '/' + parseInt(dateEnd.getTime() / 1000);
	url += '?bbox=' + JSON.stringify(currentBbox);
	
console.log('url', url);
	fetch(encodeURI(url), {
		mode: 'cors',
		credentials: 'include'
	})
		.then(function(response) { return response.json(); })
		.then(function(json) {
			console.log('dddddd', json);
		});
		
	// var data = {"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[116.608,53.648]},"properties":{"id":2277654,"brightness":307.6,"satellite":"A","confidence":57.0,"frp":15.8,"daynight":"D","ts_utc":1509425100}}]};
	// var geo = L.geoJSON(data);
	// firesOverlay.clearLayers();
	// firesOverlay.addLayer(geo);
		
	// http://sender.kosmosnimki.ru/irk-fires/hotspots/1509235200/1509321600?bbox={%22type%22:%22Polygon%22,%22coordinates%22:[[[83.671875,48.922499263758255],[83.671875,64.848937263579472],[122.958984375,64.848937263579472],[122.958984375,48.922499263758255],[83.671875,48.922499263758255]]]}
};
var updateBbox = function() {
	var screenBounds = map.getBounds(),
		p1 = screenBounds.getNorthWest(),
		p2 = screenBounds.getSouthEast();

	currentBbox = {
		type: 'Polygon',
		coordinates:[
			[
				[p1.lng, p1.lat],
				[p2.lng, p1.lat],
				[p2.lng, p2.lat],
				[p1.lng, p2.lat],
				[p1.lng, p1.lat]
			]
		]
	};
	getItems();
};
map.on('moveend', updateBbox);
updateBbox();

var protocol = location.protocol === 'file:' ? 'http:' : location.protocol,
	baseLayers = {
		'Карта': L.tileLayer(protocol + '//tilessputnik.ru/{z}/{x}/{y}.png'),
		'Спутник': L.tileLayer(protocol + '//maps.kosmosnimki.ru/TileService.ashx?LayerName=C598DBF5726945AFBEC937E086447DBF&map=5AE44B9616754357B39802C0620B2713&crs=epsg:3857&request=getTile&apiKey=6Q81IXBUQ7&z={z}&x={x}&y={y}')
	},
	overlayes = {
		'Пожары': firesOverlay,
		'Граница Иркутской обл.': L.geoJSON(irk, {
			style: function (feature) {
				return {weight: 6, fill: false, color: 'blue'};
			}
		})
	};

baseLayers['Карта'].addTo(map);
L.control.layers({}, overlayes).addTo(map);

L.control.iconLayers([
	{
        title: 'Карта',
        icon: './Leaflet-IconLayers/examples/icons/openstreetmap_blackandwhite.png',
        layer: baseLayers['Карта']
    },
	{
        title: 'Спутник',
        icon: './Leaflet-IconLayers/examples/icons/openstreetmap_mapnik.png',
        layer: baseLayers['Спутник']
    }
], {position: 'bottomright'}).addTo(map);

overlayes['Граница Иркутской обл.'].addTo(map);
firesOverlay.addTo(map);

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

// $(calendar).on('change', function() {
	// console.log('change', calendar.getDateBegin(), calendar.getDateEnd());
// });

$(calendar).on('datechange', function() {
	// console.log('datechange', calendar.getDateBegin(), calendar.getDateEnd());
	getItems(calendar.getDateBegin(), calendar.getDateEnd());
});

// firesOverlay
