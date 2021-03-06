/*
 * Copyright (c) 2014 ThoughtWorks, Inc.
 *
 * Pixelated is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Pixelated is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Pixelated. If not, see <http://www.gnu.org/licenses/>.
 */
/*global _ */

define(
  [
    'flight/lib/component',
    'views/templates',
    'tags/ui/tag_base',
    'page/events',
    'views/i18n'
  ],

  function (defineComponent, templates, tagBase, events, i18n) {
    'use strict';

    var Tag = defineComponent(tag, tagBase);

    Tag.appendedTo = function (parent, data) {
      var res = new this();
      res.renderAndAttach(parent, data);
      return res;
    };

    return Tag;

    function tag() {

      this.viewFor = function (tag, template, currentTag) {
        return template({
          tagName: tag.default ? i18n('tags.' + tag.name) : tag.name,
          ident: this.hashIdent(tag.ident),
          count: this.badgeType(tag) === 'total' ? tag.counts.total : (tag.counts.total - tag.counts.read),
          displayBadge: this.displayBadge(tag),
          badgeType: this.badgeType(tag),
          icon: tag.icon,
          selected: tag.name === currentTag ? 'selected' : ''
        });
      };

      this.decreaseReadCountIfMatchingTag = function (ev, data) {
        var mailbox_and_tags = _.flatten([data.tags, data.mailbox]);
        if (_.contains(mailbox_and_tags, this.attr.tag.name)) {
          this.attr.tag.counts.read++;
          this.$node.html(this.viewFor(this.attr.tag, templates.tags.tagInner, this.attr.currentTag));
          if (!_.isUndefined(this.attr.shortcut)) {
            this.attr.shortcut.reRender();
          }
        }
      };

      this.triggerSelect = function () {
        this.trigger(document, events.ui.tag.select, { tag: this.attr.tag.name });

        this.removeSearchingClass();
      };

      this.addSearchingClass = function() {
        if (this.attr.tag.name === 'all'){
          this.$node.addClass('searching');
        }
      };

      this.hashIdent = function(ident) {
        if (typeof ident === 'undefined') {
          return '';
        }
        if (typeof ident === 'number') {
          return ident;
        }
        if (ident.match(/^[a-zA-Z0-9 ]+$/)) {
          return ident;
        }

        /*jslint bitwise: true */
        return Math.abs(String(ident).split('').reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0));
      };

      this.removeSearchingClass = function() {
        if (this.attr.tag.name === 'all'){
          this.$node.removeClass('searching');
        }
      };

      this.after('initialize', function () {
        this.on('click', this.triggerSelect);
        this.on(document, events.mail.read, this.decreaseReadCountIfMatchingTag);
        this.on(document, events.search.perform, this.addSearchingClass);
        this.on(document, events.search.empty, this.removeSearchingClass);
      });

      this.renderAndAttach = function (parent, data) {
        var rendered = this.viewFor(data.tag, templates.tags.tag, data.currentTag);
        parent.append(rendered);
        this.initialize('#tag-' + this.hashIdent(data.tag.ident), data);
        this.on(parent, events.tags.teardown, this.teardown);
      };
    }
  }
);
