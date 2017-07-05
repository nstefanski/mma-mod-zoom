angular.module('mm.addons.mod_zoom', ['mm.core'])
.constant('mmaModZoomComponent', 'mmaModZoom')
.config(["$stateProvider", function($stateProvider) {
  $stateProvider
    .state('site.mod_zoom', {
      url: '/mod_zoom',
      params: {
        module: null,
        courseid: null
      },
      views: {
        'site': {
          controller: 'mmaModZoomIndexCtrl',
          templateUrl: '$ADDONPATH$/templates/index.html'
        }
      }
    });
}])
.config(["$mmCourseDelegateProvider", "$mmContentLinksDelegateProvider", function($mmCourseDelegateProvider, $mmContentLinksDelegateProvider) {
  $mmCourseDelegateProvider.registerContentHandler('mmaModZoom', 'zoom', '$mmaModZoomHandlers.courseContentHandler');
  $mmContentLinksDelegateProvider.registerLinkHandler('mmaModZoom', '$mmaModZoomHandlers.linksHandler');
}]);

angular.module('mm.addons.mod_zoom')
.controller('mmaModZoomIndexCtrl', ["$scope", "$stateParams", "$mmaModZoom", "$mmCourse", "$mmText", "$translate", "$q", "$mmUtil", function($scope, $stateParams, $mmaModZoom, $mmCourse, $mmText, $translate, $q, $mmUtil) {
    var module = $stateParams.module || {},
        courseId = $stateParams.courseid;
    $scope.title = module.name;
    $scope.moduleUrl = module.url;
    $scope.componentId = module.id;
    $scope.canGetUrl = $mmaModZoom.isGetUrlWSAvailable();
    function fetchContent() {
        var promise = $mmaModZoom.getZoom(courseId, module.id);
        return promise.then(function(res) {
            $scope.title = "Zoom Meeting";
            $scope.description = res.intro || res.description;
            $scope.status = res.status;
            $scope.joinMeetingBeforeHost = res.joinbeforehost;
            $scope.startWhenHostJoins = res.startvideohost;
            $scope.startWhenParticipantJoins = res.startvideopart;
            $scope.audioOptions = res.audioopt;
            $scope.passwordProtected = res.haspassword;
            $scope.startTime = new Date(res.start_time * 1000).toString(); 
            $scope.hasStartTime = res.start_time !== 0;
            $scope.available = res.available;
        }).catch(function(error) {
            $mmUtil.showErrorModalDefault(error, 'mm.course.errorgetmodule', true);
            return $q.reject();
        }).finally(function() {
            $scope.loaded = true;
            $scope.refreshIcon = 'ion-refresh';
        });
    }
    fetchContent();
    $scope.go = function() {
      $mmaModZoom.logView(module.instance).then(function () {
        $mmCourse.checkModuleCompletion(courseId, module.completionstatus);
      });
      $mmaModZoom.open(module.id);
    };
}]);

angular.module('mm.addons.mod_zoom')
  .factory('$mmaModZoomHandlers', ["$mmCourse", "$mmaModZoom", "$state", "$mmContentLinksHelper", function($mmCourse, $mmaModZoom, $state, $mmContentLinksHelper) {
    var self = {};
    self.courseContentHandler = function() {
      var self = {};
      self.isEnabled = function() {
        return true;
      };
      self.getController = function(module, courseId) {
        return function($scope) {
          $scope.title = module.name;
          $scope.icon = '$ADDONPATH$/icon.gif'
          $scope.class = 'mma-mod_zoom-handler';
          $scope.action = function(e) {
            $state.go('site.mod_zoom', {module: module, courseid: courseId});
            e.preventDefault();
            e.stopPropagation();
          };
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
    self.linksHandler = $mmContentLinksHelper.createModuleIndexLinkHandler('mmaModZoom', 'zoom', $mmaModZoom);
    return self;
  }]);

angular.module('mm.addons.mod_zoom')
.factory('$mmaModZoom', ["$mmSite", "$mmUtil", "$q", "$mmContentLinksHelper", "$mmCourse", "$mmSitesManager", function($mmSite, $mmUtil, $q, $mmContentLinksHelper, $mmCourse, $mmSitesManager) {
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
    self.logView = function(id) {
        if (id) {
            var params = {
                urlid: id
            };
            return $mmSite.write(ZOOM_GET_STATE, params);
        }
        return $q.reject();
    };
    self.isGetUrlWSAvailable = function() {
        return $mmSite.wsAvailable(ZOOM_GET_STATE);
    };
    self.isPluginEnabled = function(siteId) {
      return $mmSitesManager.getSite(siteId).then(function(site) {
        return site.wsAvailable(ZOOM_GET_STATE);
      });
    };
    self.getZoom = function(courseId, moduleId) {
      if (courseId === undefined || moduleId === undefined) {
        return $q.reject();
      }
      return getZoomData(courseId, moduleId);
    };
    self.open = function(moduleId) {
      var modal = $mmUtil.showModalLoading();
      getMeetingURL(moduleId).then(function (res) {
        return $mmSite.openInBrowserWithAutoLoginIfSameSite(res.joinurl);
      }).finally(function() {
        modal.dismiss();
      });
    };
    return self;
}]);
