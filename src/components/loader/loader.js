// Copyright 2014 Globo.com Player authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

var BaseObject = require('../../base/base_object');
var _ = require('underscore');
var PlayerInfo = require('../player_info')

/* Playback Plugins */
var HTML5VideoPlayback = require('../../playbacks/html5_video');
var FlashVideoPlayback = require('../../playbacks/flash');
var HTML5AudioPlayback = require('../../playbacks/html5_audio');
var HLSVideoPlayback = require('../../playbacks/hls');
var NoOp = require('../../playbacks/no_op');

/* Container Plugins */
var SpinnerThreeBouncePlugin = require('../../plugins/spinner_three_bounce');
var StatsPlugin = require('../../plugins/stats');
var WaterMarkPlugin = require('../../plugins/watermark');
var PosterPlugin = require('../../plugins/poster');

/* Core Plugins */
var BackgroundButton = require('../../plugins/background_button');
var SeekTime = require('../../plugins/seek_time');

class Loader extends BaseObject {
  constructor(externalPlugins) {
    super()
    this.playerInfo = PlayerInfo.getInstance()
    this.playbackPlugins = [FlashVideoPlayback, HTML5VideoPlayback, HTML5AudioPlayback, HLSVideoPlayback, NoOp]
    this.containerPlugins = [SpinnerThreeBouncePlugin, WaterMarkPlugin, PosterPlugin, StatsPlugin]
    this.globalPlugins = [BackgroundButton, SeekTime]
    if (externalPlugins) {
      this.addExternalPlugins(externalPlugins)
    }
  }

  addExternalPlugins(plugins) {
    if (plugins.playback) { this.playbackPlugins = plugins.playback.concat(this.playbackPlugins) }
    if (plugins.container) { this.containerPlugins = plugins.container.concat(this.containerPlugins) }
    if (plugins.core) { this.globalPlugins = plugins.core.concat(this.globalPlugins) }
    this.playerInfo.playbackPlugins = this.playbackPlugins
  }

  getPlugin(name) {
    var allPlugins = _.union(this.containerPlugins, this.playbackPlugins, this.globalPlugins)
    return _.find(allPlugins, function(plugin) { return plugin.prototype.name === name })
  }
}

module.exports = Loader;
