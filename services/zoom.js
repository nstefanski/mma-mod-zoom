// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.addons.mod_zoom')

/**
 * URL service.
 *
 * @module mm.addons.mod_zoom
 * @ngdoc service
 * @name $mmaModZoom
 */
.factory('$mmaModZoom', function($mmSite, $mmUtil, $q, $mmContentLinksHelper, $mmCourse, $mmSitesManager) {
    var self = {};
    var ZOOM_GET_STATE = 'mod_zoom_get_state';

    function getZoomData(courseId, moduleId) {
      return $mmSitesManager.getSite($mmSitesManager.getCurrentSite().id).then(function(site) {
        var params = {
          zoomid: moduleId
        },
        preSets = {
          siteurl: $mmSite.getURL(),
          wstoken: $mmSite.getToken()
        };

        return site.read('mod_zoom_get_state', params, preSets).then(function (response) {
          return response;
        });
      });
    }

    function getMeetingURL(zoomId) {
      return $mmSitesManager.getSite($mmSitesManager.getCurrentSite().id).then(function(site) {
        var params = {
          zoomid: zoomId
        }, preSets = {
          siteurl: $mmSite.getURL(),
          wstoken: $mmSite.getToken()
        };

        return site.read('mod_zoom_grade_item_update', params, preSets).then(function (response) {
          return response;
        });
      });
    }

    /**
     * Report a meeting as being viewed.
     *
     * @module mm.addons.mod_zoom
     * @ngdoc method
     * @name $mmaModZoom#logView
     * @param {String} id Module ID.
     * @return {Promise}  Promise resolved when the WS call is successful.
     */
    self.logView = function(id) {
        if (id) {
            var params = {
                urlid: id
            };
            return $mmSite.write(ZOOM_GET_STATE, params);
        }
        return $q.reject();
    };

    /**
     * Returns whether or not getUrl WS available or not.
     *
     * @module mm.addons.mod_zoom
     * @ngdoc method
     * @name $mmaModZoom#isGetUrlWSAvailable
     * @return {Boolean}
     */
    self.isGetUrlWSAvailable = function() {
        return $mmSite.wsAvailable(ZOOM_GET_STATE);
    };

    self.isPluginEnabled = function(siteId) {
      return $mmSitesManager.getSite(siteId).then(function(site) {
        // All WS were introduced at the same time so checking one is enough.
        return site.wsAvailable(ZOOM_GET_STATE);
      });
    };

    self.getZoom = function(courseId, moduleId) {
      if (courseId === undefined || moduleId === undefined) {
        return $q.reject();
      }
      return getZoomData(courseId, moduleId);
    };

    /**
     * Opens a URL.
     *
     * @module mm.addons.mod_zoom
     * @ngdoc method
     * @name $mmaModZoom#open
     * @param {String} url The URL to go to.
     */
    self.open = function(moduleId) {
      var modal = $mmUtil.showModalLoading();
      getMeetingURL(moduleId).then(function (res) {
        return $mmSite.openInBrowserWithAutoLoginIfSameSite(res.joinurl);
      }).finally(function() {
        modal.dismiss();
      });
    };

    return self;
});
