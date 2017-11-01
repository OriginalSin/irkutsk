var curDate = new Date(Date.now());

var dateBegin = new Date(Date.UTC(curDate.getFullYear(), curDate.getMonth(), curDate.getDate())),
	dateEnd = new Date(dateBegin.getTime() + 1000*60*60*24);

var myIcon = L.icon({
    iconUrl: 'css/fire.png',
    popupAnchor: [6, 0]
});
	
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
    .bindPopup()
    .on('popupopen ', function(ev) {
		console.log('Clicked on a member of the group!', ev);
		var marker = ev.layer,
			props = marker.feature.properties,
			arr = Object.keys(props).map(function(key) {
				return '<div><b>' + key + '</b>: ' + props[key] + '</div>';
			}),
			popup = ev.popup;
		
		popup.setContent(arr.join('\n'));
	});

var currentBbox = null;
var getItems = function() {
	//console.log(beg, end, currentBbox);
	var url = '//sender.kosmosnimki.ru/irk-fires/hotspots';
	url += '/' + parseInt(dateBegin.getTime() / 1000);
	url += '/' + parseInt(dateEnd.getTime() / 1000);
	url += '?bbox=' + JSON.stringify(currentBbox);
	
	fetch(encodeURI(url), {
		mode: 'cors',
		credentials: 'include'
	})
		.then(function(response) { return response.json(); })
		.then(function(json) {
			// console.log('json', json);
			var geo = L.geoJSON(json);
			geo.eachLayer(function (marker) {
				marker.setIcon(myIcon);
			});
			firesOverlay.clearLayers();
			firesOverlay.addLayer(geo);
		});
		
	// var data = {"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[116.608,53.648]},"properties":{"id":2277654,"brightness":307.6,"satellite":"A","confidence":57.0,"frp":15.8,"daynight":"D","ts_utc":1509425100}}]};
	// var geo = L.geoJSON(data, {
			// style: function (feature) {
				// return {iconUrl: 'fire.png', className: 'fire'};
			// }
		// });
	// geo.eachLayer(function (layer) {
		// layer.setIcon(myIcon);
	// });
	// firesOverlay.clearLayers();
	// firesOverlay.addLayer(geo);
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
        icon: './css/basemap_osm_ru.png',
        layer: baseLayers['Карта']
    },
	{
        title: 'Спутник',
        icon: './css/basemap_satellite.png ',
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
	// dateMin: new Date(Date.UTC(2011, 7, 1)),
	dateMax: dateEnd,
	dateBegin: dateBegin,
	dateEnd: dateEnd,
	minimized: true,
	showSwitcher: true,
	showTime: true
});

$(calendar).on('datechange', function() {
	dateBegin = calendar.getDateBegin();
	dateEnd = calendar.getDateEnd();
	if (dateBegin.getTime() === dateEnd.getTime()) {
		dateEnd = new Date(dateBegin.getTime() + 1000*60*60*24);
	}
	getItems(dateBegin, dateEnd);
});
