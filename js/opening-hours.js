/**
 * OpeningHours.js - Handles business hour logic and formatting
 * Designed to work in Parse.com, web and Node.js environments
 * 
 * Copyright: Tom Erik Støwer 2013
 * E-mail: testower@gmail.com
 *
 */

 // This module requires 'moment.js' => http://momentjs.com/
 // Node.js: npm install moment
 // Parse.com: already included
 // If used in browser: 
 // <script src="http://cdnjs.cloudflare.com/ajax/libs/moment.js/2.0.0/moment.min.js"></script>
 if (!moment)
 	var moment = require('moment');

 (function(exports) {
 	/**
 	 * OpeningHourRange
 	 */
 	function OpeningHourRange (attributes) {
 		if (attributes && attributes.start && attributes.end) {
 		
 			if (attributes.start.__type === 'OpeningHourTime]')
				this.start = attributes.start;
			else {
				this.start = new OpeningHourTime({
					day: attributes.start.day,
					hour: attributes.start.hour,
					minute: attributes.start.minute
				});
			}
			if (attributes.end.__type === 'OpeningHourTime')
 				this.end = attributes.end;
 			else {
 				this.end = new OpeningHourTime({
 					day: attributes.end.day,
 					hour: attributes.end.hour,
 					minute: attributes.end.minute
 				});
 			}
 		}
 	}

 	OpeningHourRange.prototype.containsDate = function (date) {
 		var offsetDay = moment(date).day();
 		if (offsetDay == 0)
 			offsetDay = 6;
 		else
 			offsetDay = offsetDay - 1;

 		var timeToCheck = new OpeningHourTime({
 			day: offsetDay, // offset
 			hour: moment(date).hour(),
 			minute: moment(date).minute()
 		});

 		return timeToCheck.isAfter(this.start) && timeToCheck.isBefore(this.end);
 	}

 	OpeningHourRange.prototype.coversAllWeek = function () {
 		var coversAllWeek = false;

 		if (this.start.isStartOfWeek())
 			if (this.end.isEndOfWeek())
 				coversAllWeek = true;

 		return coversAllWeek;
 	}

 	OpeningHourRange.prototype.coversAllWeekend = function () {
 		var coversAllWeekend = false;

 		if (this.start.isStartOfWeekend())
 			if(this.end.isEndOfWeekend())
 				coversAllWeekend = true;

 		return coversAllWeekend;
 	}

 	/**
 	 * OpeningHourTime
 	 */
 	function OpeningHourTime (attributes) {
 		if (attributes
 			&& attributes.day != null
 			&& attributes.hour != null
 			&& attributes.minute != null) {
 			this.day = attributes.day;
 			this.hour = attributes.hour;
 			this.minute = attributes.minute;
 		}

 		this.__type = 'OpeningHourTime';
 	}

 	OpeningHourTime.prototype.isAfter = function(time) {
 		if ( this.day > time.day )
 			return true;
 		else if ( this.day == time.day ) {
 			if ( this.hour > time.hour )
 				return true
 			else if ( this.hour == time.hour ) {
 				if ( this.minute > time.minute )
 					return true;
 				else
 					return false;
 			} else
 				return false;
 		} else
 			return false;
 	}

 	OpeningHourTime.prototype.isBefore = function(time) {
 		if ( this.day < time.day )
 			return true;
 		else if ( this.day == time.day ) {
 			if ( this.hour < time.hour )
 				return true;
 			else if ( this.hour == time.hour ) {
 				if ( this.minute < time.minute )
 					return true;
 				else
 					return false;
 			} else
 				return false;
 		} else
 			return false;
 	}

 	OpeningHourTime.prototype.isStartOfWeek = function() {
 		var isStartOfWeek = false;

 		if (this.day == 0)
 			if (this.hour == 0)
 				if (this.minute == 0)
 					isStartOfWeek = true;

 		return isStartOfWeek;
 	}

 	OpeningHourTime.prototype.isEndOfWeek = function() {
 		var isEndOfWeek = false;

 		if (this.day == 6)
 			if (this.hour == 23)
 				if (this.minute == 59)
 					isEndOfWeek = true;
 		if (this.day == 7)
 			isEndOfWeek = true;

 		return isEndOfWeek;
 	}

 	OpeningHourTime.prototype.isStartOfWeekend = function () {
 		var isStartOfWeekend = false;

 		if (this.day == 3)
 			if (this.hour >= 15)
 				if (this.hour <= 24)
 					isStartOfWeekend = true;
 		if (this.day == 4)
 			isStartOfWeekend = true;

 		return isStartOfWeekend;
 	}

 	OpeningHourTime.prototype.isEndOfWeekend = function () {
 		var isEndOfWeekend = false;

 		if (this.isEndOfWeek())
 			isEndOfWeekend = true;

 		return isEndOfWeekend;
 	}

 	/**
 	 * OpeningHours
 	 */
 	function OpeningHours (ranges) {
 		this.ranges = [];
 		if (Object.prototype.toString.call( ranges ) === '[object Array]' )
 			this.ranges = ranges;
 		else if (ranges.ranges) {
 			// build object from JSON
 			for (var i=0;i<ranges.ranges.length;i++) {
 				var openingHourRange = new OpeningHourRange(ranges.ranges[i]);
 				this.ranges.push(openingHourRange);
 			}
 		}
 	}

 	OpeningHours.prototype.isOpen = function (date) {
 		if (!date)
 			date = new Date();

 		if (this.isAlwaysOpen())
 			return true;

 		for(i=0;i<this.ranges.length;i++) {
 			if ( this.ranges[i].containsDate(date) )
 				return true;
 		}
 		return false;
 	}

 	OpeningHours.prototype.isAlwaysOpen = function () {
 		var isAlwaysOpen = false;

 		if (this.ranges.length == 1)
 			if (this.ranges[0].coversAllWeek())
 				isAlwaysOpen = true;

 		return isAlwaysOpen;
 	}

 	OpeningHours.prototype.isOpenAllWeekend = function () {
 		var isOpenAllWeekend = false;

 		if (this.ranges.length > 0) {
 			var range = this.ranges[this.ranges.length - 1];
 			if(range.coversAllWeekend())
 				isOpenAllWeekend = true;
 		}

 		return isOpenAllWeekend;
 	}

 	/**
 	 * OpeningHoursFormatter
 	 */
 	function OpeningHoursFormatter (options) {
 		// options
 		this._separator = ' ';
 		if (options)
 			if (options.separator)
 				this._separator = options.separator;
 	}

 	OpeningHoursFormatter.prototype.formattedOpeningHours = function (openingHours) {
 		var formatted = '';

 		if (openingHours && openingHours.isAlwaysOpen())
 			return 'Døgnåpent alle dager.';

 		if (openingHours) {
 			var ranges = openingHours.ranges;

 			for (var i=0;i<ranges.length;i++) {
 				var range = ranges[i];
 				if(!range.coversAllWeekend()) {
 					var string = '';
 					string += this.weekDayFromDay(range.start.day);
 					string += ' ';
 					string += this.formattedTimeFromHourAndMinute(range.start.hour,range.start.minute);

 					string += ' - ';
 					string += this.formattedTimeFromHourAndMinute(range.end.hour,range.end.minute);
 					
 					if (i != ranges.length - 1)
 						string += this._separator;

 					formatted += string;
 				}
 				
 			}	
 		}
 		
 		if (openingHours && openingHours.isOpenAllWeekend())
 			formatted += 'Døgnåpent helg.';

 		return formatted;
 	}

 	OpeningHoursFormatter.prototype.formattedTimeFromHourAndMinute = function (hour, minute) {
 		var string = '';
 		if(hour < 10)
 			string += '0';
 		string += hour;
 		string += ":";
 		if(minute < 10)
 			string += '0';
 		string += minute;
 		return string;
 	}

 	OpeningHoursFormatter.prototype.weekDayFromDay = function (day) {
 		var days = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];
 		return days[day];
 	}

	exports.OpeningHourRange = OpeningHourRange;
 	exports.OpeningHourTime = OpeningHourTime;
 	exports.OpeningHours = OpeningHours;
 	exports.OpeningHoursFormatter = OpeningHoursFormatter;

 })(typeof exports === 'undefined' ? this['OpeningHoursModule']={}: exports);
