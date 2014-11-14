'use strict';

var urls = require('./urls.js');
var events = require('./events.js');
var Handlebars = require('handlebars');
var candidateHelpers = require('../../../shared/candidate-helpers.js');
var categories = require('./api.js').entitiesArray;
var templates = {};

var renderBrowse = function(e) {
    var tmplName = e.category + '-table',
        promise = loadTemplate('views/partials/' + tmplName + '.handlebars');

        promise.done(function(data) {
            var context = {},
                totalPages;

            context.candidates = candidateHelpers.buildCandidateContext(e.data[2].results);
            context.resultsCount = e.data[1].pagination.count;
            context.page = e.data[1].pagination.page;
            totalPages = e.data[1].pagination.pages / e.data[1].pagination.per_page;
             if (typeof e.filters === 'undefined') {
                e.filters = {};
            }

            if (e.data[1].pagination.page < totalPages) {
                e.filters.page = e.data[1].pagination.page + 1;
                context.nextURL = urls.buildURL(e);
            }
            if (context.page > 1) {
                e.filters.page = e.data[1].pagination.page + 1;
                context.prevURL = urls.buildURL(e);
            }
            context.perPage = e.data[1].pagination.per_page;
            context.currentResultsStart = context.perPage * (context.page - 1) + 1;
            context.currentResultsEnd = context.perPage * context.page;

            templates[tmplName] = Handlebars.compile(data);
            $('#' + e.category).html(templates[tmplName](context));
            events.emit('bind:browse');
        }.bind(e));
};

var renderFilters = function(e) {
    var tmplName = e.category,
        partialName = tmplName + '-table';

    // pre-load table partial so the template can be shared on client + server
    $.when(
        loadTemplate('views/' + tmplName + '.handlebars'),
        loadTemplate('views/partials/' + tmplName + '-table.handlebars')
    ).done(function(tmpl1, tmpl2) {
        templates[tmplName] = Handlebars.compile(tmpl1[0]);
        templates[partialName] = Handlebars.registerPartial(partialName, tmpl2[0]);
        $('#main').html(templates[tmplName]());
        events.emit('bind:filters', e);
    });
};

var renderSearch = function(e) {
    var promises = [],
        i,
        len = categories.length;

    promises.push(loadTemplate('views/search-results.handlebars'));
    promises.push(loadTemplate('views/partials/search-bar.handlebars'));

    for (i = 0; i < len; i++) {
        promises.push(loadTemplate('views/partials/' + categories[i] + 's-table.handlebars'));
    }

    $.when.apply($, promises).done(function() {
        var i,
            len = arguments.length,
            tmplName;

        templates['search-results'] = Handlebars.compile(arguments[0][0]);
        templates['search-bar'] = Handlebars.registerPartial('search-bar', arguments[1][0]);
        
        for (i = 2; i < len; i++) {
            tmplName = categories[i] + 's-table';
            templates[tmplName] = Handlebars.registerPartial(tmplName, arguments[i][0]);
        }        

        $('#main').html(templates['search-results']());
    });
};

var loadTemplate = function(url) {
    return $.ajax({
        url: url,
        dataType: 'text'
    });
};

module.exports = {
    init: function() {
        events.on('render:browse', renderBrowse);
        events.on('load:browse', renderFilters);
        events.on('render:filters', renderFilters);
        events.on('render:search', renderSearch);
    }
};
