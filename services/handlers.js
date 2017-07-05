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
 * Mod Questionnaire handler.
 *
 * @module mm.addons.mod_zoom
 * @ngdoc service
 * @name $mmaModZoomHandlers
 */
  .factory('$mmaModZoomHandlers', function($mmCourse, $mmaModZoom, $state, $mmContentLinksHelper) {
    var self = {};

    /**
     * Course content handler.
     *
     * @module mm.addons.mod_zoom
     * @ngdoc method
     * @name $mmaModZoomHandlers#courseContentHandler
     */
    self.courseContentHandler = function() {
      var self = {};

      /**
       * Whether or not the module is enabled for the site.
       *
       * @return {Boolean}
       */
      self.isEnabled = function() {
        return true;
      };

      /**
       * Get the controller.
       *
       * @param {Object} module The module info.
       * @param {Number} courseId The course ID.
       * @return {Function}
       */
      self.getController = function(module, courseId) {
        return function($scope) {
          $scope.title = module.name;
          $scope.class = 'mma-mod_zoom-handler';
          $scope.action = function(e) {
            $state.go('site.mod_zoom', {module: module, courseid: courseId});
            e.preventDefault();
            e.stopPropagation();
          };

          // Get contents.
          $scope.spinner = true;
          $mmCourse.loadModuleContents(module, courseId).then(function() {
            if (module.contents && module.contents[0] && module.contents[0].fileurl) {
              $scope.buttons = [{
                icon: 'ion-link',
                label: 'mm.core.openmeeting',
                action: function(e) {
                  if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                  $mmaModZoom.logView(module.instance).then(function() {
                    $mmCourse.checkModuleCompletion(courseId, module.completionstatus);
                  });
                  $mmaModZoom.open(module.contents[0].fileurl);
                }
              }];
            }
          }).finally(function() {
            $scope.spinner = false;
          });
        };
      };

      return self;
    };


    /**
     * Content links handler.
     *
     * @module mm.addons.mod_url
     * @ngdoc method
     * @name $mmaModZoomHandlers#linksHandler
     */
    self.linksHandler = $mmContentLinksHelper.createModuleIndexLinkHandler('mmaModZoom', 'zoom', $mmaModZoom);

    return self;
  });

