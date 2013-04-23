
// "Legevakter" is a Parse.js Backbone application
$(function() {

	Parse.$ = jQuery;

	// Initialize Parse
	Parse.initialize("b8miWZyVIuwxB47cjOTa6ik6B5DiaO4bnZeVQgNA", 
		"Xo3H0UKj36YYTZCo3fNmIvaOP5eAwIdr5XMUeZkH");

	// HealthService model
	// -------------------

	var HealthService = Parse.Object.extend("HealthService", {

	});

	var LocationName = Parse.Object.extend("LocationName", {

	});

	var AppState = Parse.Object.extend("AppState", {

	});

	// HealthService Collection
	// ------------------------
	var HealthServiceList = Parse.Collection.extend({
		model: HealthService
	});

	var LocationNameList = Parse.Collection.extend({
		model: LocationName
	});

	// HealthService View
	// ------------------
	var HealthServiceView = Parse.View.extend({

		//... is a list tag
		tagName: "li",

		// Cache the template function for a single health service
		template: _.template($('#health-service-template').html()),

		initialize: function() {
			_.bindAll(this, 'render');
		},

		distanceFromUserLocation: function() {
			if (state.userLocation)
				return "(" + this.model.get("geoPoint").kilometersTo(state.userLocation).toFixed(1) + "km)";
		},

		// Re-render the contents
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		}
	});

	var LocationNameView = Parse.View.extend({

		tagName: "div",

		template: _.template($("#location-name-template").html()),

		initialize: function() {
			_.bindAll(this, 'render');
		},

		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		}
	});

	// The Application
	// ---------------

	// Health Services Near You
	var HealthServicesNearYou = Parse.View.extend({
		el: ".health-services",

		events: {
			"keypress #search": "searchOnEnter"
		},

		initialize: function() {
			var self = this;

			_.bindAll(this, 'addOne', 'addAll', 'searchOnEnter');

			// Template
			this.$el.html(_.template($("#health-services-near-you-template").html()));

			this.input = this.$("#search");

			this.healthServices = new HealthServiceList();

			this.healthServices.bind('add', this.addOne);
			this.healthServices.bind('reset', this.addAll);

			


			Parse.GeoPoint.current({
				success: function(geoPoint) {
					state.userLocation = geoPoint;
					self.healthServices.query = new Parse.Query(HealthService);
					self.healthServices.query.withinKilometers("geoPoint", geoPoint, 25);

					self.healthServices.fetch();
				},
				error: function(error) {
					console.log("Error: " + error.message);

					self.healthServices.query = new Parse.Query(HealthService);
					self.healthServices.query.limit(10);

					self.healthServices.fetch();
				}
			});

		},

		addOne: function(healthService) {
			var view = new HealthServiceView({model: healthService});
			this.$("#health-services-list").append(view.render().el);
		},
		addAll: function(collection, filter) {
			this.$("#health-services-list").html("");
			this.healthServices.each(this.addOne);
		},
		searchOnEnter: function(e) {
			var self = this;
			if (e.keyCode != 13) return;

			var searchString = this.input.val().toLowerCase();

			Parse.Cloud.run("searchForHealthServicesWithString", 
				{ "searchString": searchString }, {
					success: function(results) {
						self.healthServices.reset(results.searchStringInNameHealthServices);
						var locationResults = results.searchStringInLocationNameHealthServices;
						self.locationNameView = new LocationNameResultsView();
						self.locationNameView.setLocationNames(locationResults);

						for(i=0;i<locationResults.length;i++) {
							var locationNameHealthServicesView = new LocationNameHealthServicesView();
							locationNameHealthServicesView.populate(locationResults[i]);		
						}
					},
					error: function(error) {
						console.log("error: " + error.message);
					}
				});
		}
	});

	var LocationNameResultsView = Parse.View.extend({
		el: ".location-names",

		setLocationNames: function(locationNames) {
		 	this.locationNameList.reset(locationNames);
		},

		initialize: function() {
			var self = this;
			_.bindAll(this, 'addOne', 'addAll');

			this.$el.html(_.template($("#location-name-result-template").html()));

			this.locationNameList = new LocationNameList();

			this.locationNameList.bind('add', this.addOne);
			this.locationNameList.bind('reset', this.addAll);

		},

		addOne: function(locationName) {
			var view = new LocationNameView({model: locationName});
			this.$("#location-name-results").append(view.render().el);
		},
		addAll: function(collection, filter) {
			this.$("#location-name-results").html("");
			this.locationNameList.each(this.addOne);
		}
	});

	var LocationNameHealthServicesView = Parse.View.extend({
		el: ".location-names",

		populate: function(locationName) {
			this.canonical = "#location-name-results-" + locationName.locationId;
			this.healthServiceList.reset(locationName.healthServices);
		},

		initialize: function() {
			var self = this;
			_.bindAll(this, 'addOne', 'addAll');
			
			this.healthServiceList = new HealthServiceList();

			this.healthServiceList.bind('add', this.addOne);
			this.healthServiceList.bind('reset', this.addAll);
		},

		addOne: function(healthService) {
			var view = new HealthServiceView({model: healthService});
			this.$(this.canonical).append(view.render().el);
		},
		addAll: function(collection, filter) {
			this.$(this.canonical).html("");
			this.healthServiceList.each(this.addOne);
		}
	});

	// Main view for the app
	var AppView = Parse.View.extend({
		el: $("#healthserviceapp"),

		initialize: function() {
			this.render();
		},

		render: function() {
			new HealthServicesNearYou();
		}
	});

  	var AppRouter = Parse.Router.extend({
    	routes: {
      	"all": "all",
      	"active": "active",
      	"completed": "completed"
    	},

    	initialize: function(options) {
    	},

    	all: function() {
    	  state.set({ filter: "all" });
    	},

    	active: function() {
    	  state.set({ filter: "active" });
    	},

    	completed: function() {
    	  state.set({ filter: "completed" });
    	}
  	});

	var state = new AppState;

	new AppRouter;
	new AppView;
	Parse.history.start();
});
