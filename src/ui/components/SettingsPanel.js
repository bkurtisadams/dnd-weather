// Settings configuration panel 
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe2, Mountain, Compass, Calendar, Settings2 } from 'lucide-react';

const SettingsPanel = () => {
  const [settings, setSettings] = useState({
    general: {
      enabled: true,
      autoUpdate: true,
      updateInterval: 24, // hours
      displayInChat: true
    },
    location: {
      terrain: 'plains',
      latitude: 45,
      elevation: 0,
      isCoastal: false
    },
    calendar: {
      useSimpleCalendar: true,
      syncWithGameTime: true,
      monthNames: [
        'Needfest',
        'Fireseek',
        'Readying',
        'Coldeven',
        'Growfest',
        'Planting',
        'Flocktime',
        'Wealsun',
        'Richfest',
        'Reaping',
        'Goodmonth',
        'Harvester',
        'Brewfest',
        'Patchwall',
        'Ready\'reat',
        'Sunsebb'
      ]
    }
  });

  const terrainTypes = [
    'plains',
    'forest',
    'jungle',
    'swamp',
    'desert',
    'mountains',
    'rough terrain',
    'hills'
  ];

  const handleGeneralSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [key]: value
      }
    }));
  };

  const handleLocationSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [key]: value
      }
    }));
  };

  const handleCalendarSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        [key]: value
      }
    }));
  };

  return (
    <div className="w-full max-w-4xl">
      {/* General Settings */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.general.enabled}
                  onChange={(e) => handleGeneralSettingChange('enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                Enable Weather System
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.general.autoUpdate}
                  onChange={(e) => handleGeneralSettingChange('autoUpdate', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                Auto Update Weather
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                Update Interval (hours)
                <input
                  type="number"
                  value={settings.general.updateInterval}
                  onChange={(e) => handleGeneralSettingChange('updateInterval', parseInt(e.target.value))}
                  min="1"
                  max="72"
                  className="w-20 rounded border border-gray-300 p-1"
                />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.general.displayInChat}
                  onChange={(e) => handleGeneralSettingChange('displayInChat', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                Display Weather Updates in Chat
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Settings */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5" />
            Location Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                Terrain Type
                <select
                  value={settings.location.terrain}
                  onChange={(e) => handleLocationSettingChange('terrain', e.target.value)}
                  className="rounded border border-gray-300 p-1"
                >
                  {terrainTypes.map(terrain => (
                    <option key={terrain} value={terrain}>
                      {terrain.charAt(0).toUpperCase() + terrain.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                Latitude (°N/S)
                <input
                  type="number"
                  value={settings.location.latitude}
                  onChange={(e) => handleLocationSettingChange('latitude', parseInt(e.target.value))}
                  min="0"
                  max="90"
                  className="w-20 rounded border border-gray-300 p-1"
                />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                Elevation (feet)
                <input
                  type="number"
                  value={settings.location.elevation}
                  onChange={(e) => handleLocationSettingChange('elevation', parseInt(e.target.value))}
                  min="0"
                  step="100"
                  className="w-24 rounded border border-gray-300 p-1"
                />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.location.isCoastal}
                  onChange={(e) => handleLocationSettingChange('isCoastal', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                Coastal Region
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.calendar.useSimpleCalendar}
                  onChange={(e) => handleCalendarSettingChange('useSimpleCalendar', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                Use Simple Calendar Module
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.calendar.syncWithGameTime}
                  onChange={(e) => handleCalendarSettingChange('syncWithGameTime', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                Sync with Game Time
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;