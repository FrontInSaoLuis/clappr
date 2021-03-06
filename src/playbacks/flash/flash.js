// Copyright 2014 Globo.com Player authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

var UIObject = require('../../base/ui_object')
var Styler = require('../../base/styler')
var JST = require('../../base/jst')
var Mediator = require('../../components/mediator')
var _ = require('underscore')
var $ = require('jquery')
var Browser = require('../../components/browser')

var objectIE = '<object type="application/x-shockwave-flash" id="<%= cid %>" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" data-flash-vod=""><param name="movie" value="<%= swfPath %>"> <param name="quality" value="autohigh"> <param name="swliveconnect" value="true"> <param name="allowScriptAccess" value="always"> <param name="bgcolor" value="#001122"> <param name="allowFullScreen" value="false"> <param name="wmode" value="gpu"> <param name="tabindex" value="1"> </object>'

class Flash extends UIObject {
  get name() { return 'flash' }
  get tagName() { return 'object' }
  get template() { return JST.flash }

  constructor(options) {
    super(options)
    console.log("flash plugin")
    this.src = options.src
    this.isRTMP = !!(this.src.indexOf("rtmp") > -1)
    this.swfPath = options.swfPath || "http://cdn.clappr.io/latest/assets/Player.swf"
    this.autoPlay = options.autoPlay
    this.settings = {default: ['seekbar']}
    if (this.isRTMP) {
      this.settings.left = ["playstop", "volume"]
      this.settings.right = ["fullscreen"]
    } else {
      this.settings.left = ["playpause", "position", "duration"]
      this.settings.right = ["volume", "fullscreen"]
    }

    this.isReady = false
    this.addListeners()
  }


  bootstrap() {
    this.el.width = "100%"
    this.el.height = "100%"
    this.isReady = true
    this.trigger('playback:ready', this.name)
    this.currentState = "IDLE"
    this.autoPlay && this.play()
    $('<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%" />').insertAfter(this.$el)
  }

  setupFirefox() {
    var $el = this.$('embed')
    $el.attr('data-flash', '')
    this.setElement($el[0])
  }

  isHighDefinitionInUse() {
    return false
  }

  updateTime() {
    this.trigger('playback:timeupdate', this.el.getPosition(), this.el.getDuration(), this.name)
  }

  addListeners() {
    Mediator.on(this.uniqueId + ':progress', () => this.progress())
    Mediator.on(this.uniqueId + ':timeupdate', () => this.updateTime())
    Mediator.on(this.uniqueId + ':statechanged', () => this.checkState())
    Mediator.on(this.uniqueId + ':flashready', () => this.bootstrap())
  }

  stopListening() {
    super()
    Mediator.off(this.uniqueId + ':progress')
    Mediator.off(this.uniqueId + ':timeupdate')
    Mediator.off(this.uniqueId + ':statechanged')
  }

  checkState() {
    if (this.currentState !== "PLAYING_BUFFERING" && this.el.getState() === "PLAYING_BUFFERING") {
      this.trigger('playback:buffering', this.name)
      this.currentState = "PLAYING_BUFFERING"
    } else if (this.currentState === "PLAYING_BUFFERING" && this.el.getState() === "PLAYING") {
      this.trigger('playback:bufferfull', this.name)
      this.currentState = "PLAYING"
    } else if (this.el.getState() === "IDLE") {
      this.currentState = "IDLE"
    } else if (this.el.getState() === "ENDED") {
      this.trigger('playback:ended', this.name)
      this.trigger('playback:timeupdate', 0, this.el.getDuration(), this.name)
      this.currentState = "ENDED"
    }
  }

  progress() {
    if (this.currentState !== "IDLE" && this.currentState !== "ENDED") {
      this.trigger('playback:progress', 0, this.el.getBytesLoaded(), this.el.getBytesTotal(), this.name)
    }
  }

  firstPlay() {
    this.currentState = "PLAYING"
    this.el.playerPlay(this.src)
  }

  play() {
    if(this.el.getState() === 'PAUSED') {
      this.currentState = "PLAYING"
      this.el.playerResume()
    } else if (this.el.getState() !== 'PLAYING') {
      this.firstPlay()
    }
    this.trigger('playback:play', this.name)
  }

  volume(value) {
    this.el.playerVolume(value)
  }

  pause() {
    this.currentState = "PAUSED"
    this.el.playerPause()
  }

  stop() {
    this.el.playerStop()
    this.trigger('playback:timeupdate', 0, this.name)
  }

  isPlaying() {
    return !!(this.isReady && this.currentState === "PLAYING")
  }

  getDuration() {
    return this.el.getDuration()
  }

  seek(time) {
    var seekTo = this.el.getDuration() * (time / 100)
    this.el.playerSeek(seekTo)
    this.trigger('playback:timeupdate', seekTo, this.el.getDuration(), this.name)
    if (this.currentState === "PAUSED") {
      this.pause()
    }
  }

  destroy() {
    clearInterval(this.bootstrapId)
    this.stopListening()
    this.$el.remove()
  }

  setupIE() {
    this.setElement($(_.template(objectIE)({cid: this.cid, swfPath: this.swfPath})))
  }

  render() {
    var style = Styler.getStyleFor(this.name)
    this.$el.html(this.template({ cid: this.cid, swfPath: this.swfPath, playbackId: this.uniqueId }))
    if(Browser.isFirefox) {
      this.setupFirefox()
    } else if(Browser.isLegacyIE) {
      this.setupIE()
    }
    this.$el.append(style)
    return this
  }
}

Flash.canPlay = function(resource) {
  //http://help.adobe.com/en_US/flashmediaserver/techoverview/WS07865d390fac8e1f-4c43d6e71321ec235dd-7fff.html
  if (resource.indexOf('rtmp') > -1) {
    return true
  } else if (Browser.isFirefox || Browser.isLegacyIE) {
    return _.isString(resource) && !!resource.match(/(.*).(mp4|mov|f4v|3gpp|3gp)/)
  } else {
    return _.isString(resource) && !!resource.match(/(.*).(mov|f4v|3gpp|3gp)/)
  }
}

module.exports = Flash
