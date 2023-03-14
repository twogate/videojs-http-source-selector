//! videojs-http-source-selector v1.1.7 ~~ https://github.com/FreeTubeApp/videojs-http-source-selector ~~ MIT License

'use strict';

var videojs = require('video.js');

var version = "1.1.7";

const MenuItem = videojs.getComponent('MenuItem');
const Component = videojs.getComponent('Component');

/**
 * MenuItem for changing the video source
 *
 * @returns {SourceMenuItem} Sorted array of SourceMenuItems
 */
class SourceMenuItem extends MenuItem {
  /**
   * Create SourceMenuItems and sort them
   *
   * @param {videojs.Player} player
   * A videojs player
   * @param {{label, index, selected, sortValue, selectable: true, multiSelectable: false}} options
   * Multiselectable
   */
  constructor(player, options) {
    options.selectable = true;
    options.multiSelectable = false;
    super(player, options);
  }

  /**
   * Function called whenever a SourceMenuItem is clicked
   */
  handleClick() {
    const selected = this.options_;
    super.handleClick();
    const levels = [...this.player_.qualityLevels().levels_];
    for (const [index, level] of levels.entries()) {
      level.enabled = selected.index === levels.length || selected.index === index;
    }
  }

  /**
   * Create SourceMenuItems and sort them
   */
  update() {
    const selectedIndex = this.player_.qualityLevels().selectedIndex;
    this.selected(this.options_.index === selectedIndex);
  }
}
Component.registerComponent('SourceMenuItem', SourceMenuItem);

const MenuButton = videojs.getComponent('MenuButton');

/**
 * A button that hides/shows sorted SourceMenuItems
 */
class SourceMenuButton extends MenuButton {
  /**
   * Create SourceMenuItems and sort them
   *
   * @param {videojs.Player} player
   * videojs player
   * @param {{default}} options
   * high | low
   */
  constructor(player, options) {
    super(player, options);
    const qualityLevels = this.player_.qualityLevels();

    // Handle options: We accept an options.default value of ( high || low )
    // This determines a bias to set initial resolution selection.
    if (options && options.default) {
      if (options.default === 'low') {
        for (const [index, qualityLevel] of qualityLevels.entries()) {
          qualityLevel.enabled = index === 0;
        }
      } else if (options.default === 'high') {
        for (let index = 0; index < qualityLevels.length; index++) {
          qualityLevels[index].enabled = index === qualityLevels.length - 1;
        }
      }
    }

    // Bind update to qualityLevels changes
    // Todo: switch to Function.prototype.bind
    this.player_.qualityLevels().on(['change', 'addqualitylevel', 'removequalitylevel'], videojs.bind(this, this.update));
  }

  /**
   * Create div with videojs classes
   *
   * @returns {videojs.MenuButton} The sum of the two numbers.
   */
  createEl() {
    return videojs.dom.createEl('div', {
      className: 'vjs-http-source-selector vjs-menu-button vjs-menu-button-popup vjs-control vjs-button'
    });
  }

  /**
   * Create SourceMenuItems and sort them
   *
   * @returns {SourceMenuItem[]} The sum of the two numbers.
   */
  buildCSSClass() {
    return MenuButton.prototype.buildCSSClass.call(this);
  }

  /**
   * Update the menu button
   *
   * @returns {videojs.MenuButton} The updated menu button
   */
  update() {
    return MenuButton.prototype.update.call(this);
  }

  /**
   * Create SourceMenuItems and sort them
   *
   * @returns {SourceMenuItem[]} Sorted array of SourceMenuItems
   */
  createItems() {
    const menuItems = [];
    const levels = this.player_.qualityLevels();
    const labels = [];
    for (let index = levels.length - 1; index >= 0; index--) {
      const selected = index === levels.selectedIndex;

      // Display height if height metadata is provided with the stream, else use bitrate
      let label = `${index}`;
      let sortValue = index;
      const level = levels[index];
      if (level.height) {
        label = `${level.height}p`;
        sortValue = Number.parseInt(level.height, 10);
      } else if (level.bitrate) {
        label = `${Math.floor(level.bitrate / 1e3)} kbps`;
        sortValue = Number.parseInt(level.bitrate, 10);
      }

      // Skip duplicate labels
      if (labels.includes(label)) {
        continue;
      }
      labels.push(label);
      menuItems.push(new SourceMenuItem(this.player_, {
        label,
        index,
        selected,
        sortValue
      }));
    }

    // If there are multiple quality levels, offer an 'auto' option
    if (levels.length > 1) {
      menuItems.push(new SourceMenuItem(this.player_, {
        label: 'Auto',
        index: levels.length,
        selected: false,
        sortValue: 99999
      }));
    }

    // Sort menu items by their label name with Auto always first
    menuItems.sort(function (a, b) {
      return b.options_.sortValue - a.options_.sortValue;
    });
    return menuItems;
  }
}

// Default options for the plugin.
const defaults = {};
const Plugin = videojs.getPlugin('plugin');
class httpSourceSelector extends Plugin {
  /**
   * Initialize httpSourceSelector plugin
   *
   * @param {object} player
   * videojs player
   * @param {{default}} options
   * high | low
   */
  constructor(player, options) {
    var _videojs$obj;
    videojs.registerComponent('SourceMenuButton', SourceMenuButton);
    videojs.registerComponent('SourceMenuItem', SourceMenuItem);
    const merge = (videojs === null || videojs === void 0 ? void 0 : (_videojs$obj = videojs.obj) === null || _videojs$obj === void 0 ? void 0 : _videojs$obj.merge) || videojs.mergeOptions;
    const settings = merge(defaults, options);
    super(player, settings);
    this.options_ = settings;
    this.player_ = player;
    this.on(player, 'ready', () => {
      this.reset();
      this.init();
    });
  }
  init() {
    this.player_.addClass('vjs-http-source-selector');
    this.player_.videojsHTTPSouceSelectorInitialized = true;
    if (this.player_.techName_ === 'Html5') {
      this.on(this.player_, 'loadedmetadata', () => {
        this.metadataLoaded();
      });
    } else {
      console.error(this.player_.techName_ + ' tech is not supported');
      this.reset();
    }
  }
  reset() {
    this.player_.removeClass('vjs-http-source-selector');
    if (this.player_.videojsHTTPSouceSelectorInitialized === true) {
      if (!this.player_.controlBar.getChild('SourceMenuButton')) {
        this.player_.controlBar.removeChild('SourceMenuButton', {});
      }
      this.player_.videojsHTTPSouceSelectorInitialized = false;
    }
  }
  metadataLoaded() {
    const controlBar = this.player_.controlBar;
    const fullscreenToggle = controlBar.getChild('fullscreenToggle');
    if (!controlBar.getChild('SourceMenuButton')) {
      if (fullscreenToggle) {
        controlBar.el().insertBefore(controlBar.addChild('SourceMenuButton').el(), fullscreenToggle.el());
      } else {
        controlBar.el().append(controlBar.addChild('SourceMenuButton').el());
      }
    }
  }
}
const registerPlugin = videojs.registerPlugin;

// Register the plugin with video.js.
registerPlugin('httpSourceSelector', httpSourceSelector);

// Include the version number.
httpSourceSelector.VERSION = version;

module.exports = httpSourceSelector;
