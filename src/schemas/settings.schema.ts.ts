import { Schema, model } from "mongoose";

export const settingsSchema = new Schema({
  userID: { type: Schema.Types.ObjectId, ref: "user", index: true },
  settings: {
    appearance: {
      theme: { type: String },
      scale: { type: Number },
    },
    notifications: {
      doNotDisturb: { type: Boolean },
    },
  },
});

export interface ISettings {
  userID: string;
  settings: ICategories;
  __v?: number;
}

export interface ICategories {
  appearance: {
    theme: "light" | "dark";
    scale: number;
  };
  notifications: {
    doNotDisturb: boolean;
  };
}

export interface ISettingsDocument extends ISettings, Document {}
export const Settings = model<ISettingsDocument>("settings", settingsSchema);
