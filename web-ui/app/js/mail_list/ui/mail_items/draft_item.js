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
    'helpers/view_helper',
    'mail_list/ui/mail_items/mail_item',
    'page/events'
  ],

  function (defineComponent, templates, viewHelpers, mailItem, events) {
    'use strict';

    return defineComponent(draftItem, mailItem);

    function draftItem() {
      function isOpeningOnANewTab(ev) {
        return ev.metaKey || ev.ctrlKey || ev.which === 2;
      }

      this.triggerOpenMail = function (ev) {
        if (isOpeningOnANewTab(ev)) {
          return;
        }
        this.trigger(document, events.dispatchers.rightPane.openDraft, { ident: this.attr.ident });
        this.trigger(document, events.ui.mail.updateSelected, { ident: this.attr.ident });
        this.trigger(document, events.router.pushState, { mailIdent: this.attr.ident });
        ev.preventDefault(); // don't let the hashchange trigger a popstate
      };

      this.render = function () {
        var mailItemHtml = templates.mails.sent(this.attr);
        this.$node.html(mailItemHtml);
        this.$node.addClass(this.attr.statuses);
        if(this.attr.selected) { this.doSelect(); }
        this.on(this.$node.find('a'), 'click', this.triggerOpenMail);
      };

      this.after('initialize', function () {
        this.initializeAttributes();
        this.render();
        this.attachListeners();

        if (this.attr.isChecked) {
          this.checkCheckbox();
        }

        this.on(document, events.ui.composeBox.newMessage, this.doUnselect);
        this.on(document, events.ui.mail.updateSelected, this.updateSelected);
        this.on(document, events.mails.teardown, this.teardown);
      });
    }
  }
);
