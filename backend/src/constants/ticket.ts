import { Priority } from "@prisma/client";

export const PRIORITY_VALUES = Object.values(Priority);

export const TITLE_MAX_LENGTH = 255;
export const DESCRIPTION_MAX_LENGTH = 10000;

export const DEFAULT_USER_EMAIL = "alice.johnson@example.com";
