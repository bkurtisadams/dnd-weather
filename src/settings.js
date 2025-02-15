import { WeatherDialog } from './ui/components/WeatherDialog.js';

// System settings 
export const registerSettings = () => {
    // Register module settings
    game.settings.register('dnd-weather', 'latitude', {
      name: game.i18n.localize('DND-WEATHER.settings.latitude.name'),
      hint: game.i18n.localize('DND-WEATHER.settings.latitude.hint'),
      scope: 'world',
      config: true,
      type: Number,
      default: 40,
      range: {
        min: 0,
        max: 90,
        step: 1
      }
    });
  
    game.settings.register('dnd-weather', 'elevation', {
      name: game.i18n.localize('DND-WEATHER.settings.elevation.name'),
      hint: game.i18n.localize('DND-WEATHER.settings.elevation.hint'),
      scope: 'world',
      config: true,
      type: Number,
      default: 0,
      range: {
        min: 0,
        max: 20000,
        step: 100
      }
    });
  
    game.settings.register('dnd-weather', 'terrain', {
      name: game.i18n.localize('DND-WEATHER.settings.terrain.name'),
      hint: game.i18n.localize('DND-WEATHER.settings.terrain.hint'),
      scope: 'world',
      config: true,
      type: String,
      default: 'plains',
      choices: {
        plains: 'DND-WEATHER.terrain.plains',
        forest: 'DND-WEATHER.terrain.forest',
        hills: 'DND-WEATHER.terrain.hills',
        mountains: 'DND-WEATHER.terrain.mountains',
        desert: 'DND-WEATHER.terrain.desert',
        coast: 'DND-WEATHER.terrain.coast',
        ocean: 'DND-WEATHER.terrain.ocean'
      }
    });
  
    // Register UI hooks
    Hooks.on('getSceneControlButtons', (controls) => {
      controls.push({
        name: 'weather',
        title: 'DND-WEATHER.ui.generate',
        icon: 'fas fa-cloud',
        visible: game.user.isGM,
        tools: [{
          name: 'generate',
          title: 'DND-WEATHER.ui.generate',
          icon: 'fas fa-dice',
          button: true,
          onClick: () => {
            new WeatherDialog().render(true);
          }
        }]
      });
    });
  };
  
  // WeatherDialog class
  /* class WeatherDialog extends Application {
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        id: 'dnd-weather-dialog',
        template: 'modules/dnd-weather/src/ui/templates/weather-dialog.hbs',
        title: game.i18n.localize('DND-WEATHER.Dialog.Title'),
        width: 560,
        height: 'auto'
      });
    }
  
    getData() {
      const weatherSystem = game.modules.get('dnd-weather').weatherSystem;
      return {
        weather: weatherSystem.getCurrentWeather(),
        isGM: game.user.isGM
      };
    }
  
    activateListeners(html) {
      super.activateListeners(html);
      
      html.find('.generate-weather').click(this._onGenerateWeather.bind(this));
      html.find('.update-weather').click(this._onUpdateWeather.bind(this));
      html.find('.settings').click(this._onOpenSettings.bind(this));
    }
  
    async _onGenerateWeather(event) {
      event.preventDefault();
      const weatherSystem = game.modules.get('dnd-weather').weatherSystem;
      await weatherSystem.generateWeather();
      this.render();
    }
  
    async _onUpdateWeather(event) {
      event.preventDefault();
      const weatherSystem = game.modules.get('dnd-weather').weatherSystem;
      await weatherSystem.updateWeather();
      this.render();
    }
  
    _onOpenSettings(event) {
      event.preventDefault();
      new SettingsConfig().render(true);
    }
  } */