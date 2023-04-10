import {
  ICategories,
  ISettings,
  Settings,
} from "../schemas/settings.schema.ts";
import { User } from "../schemas/user.schema";
import { io } from "../utils/websocket.server";

export class SettingsService {
  async get(userID: string) {
    const settings = await Settings.findOne({ userID });
    if (!settings)
      throw { code: 404, message: "Settings for this user do not exist" };

    return { settings: settings.settings };
  }

  async create(userID: string) {
    const user = await User.findById(userID);
    if (!user) throw { code: 404, message: "User does not exist" };

    const settings = await Settings.findOne({ userID });
    if (settings) throw { code: 400, message: "Settings already exist" };

    const newSettings = new Settings({
      userID,
      settings: {
        appearance: {
          scale: 100,
          theme: "dark",
        },
        notifications: {
          doNotDisturb: false,
        },
      },
    });

    await newSettings.save();
  }

  async update(userID: string, usersettings: ICategories) {
    const settings = await Settings.findOne({ userID });
    if (!settings)
      throw { code: 404, message: "Settings for this user do not exist" };

    settings.settings = { ...usersettings };

    await settings.save();

    io.to(userID).emit("settings:update", {
      settings: settings.settings,
    });
  }
}

export const settignsService = new SettingsService();
