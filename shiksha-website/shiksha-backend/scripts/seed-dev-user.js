require("dotenv").config();
const mongoose = require("mongoose");

const School = require("../models/school.model");
const User = require("../models/user.model");

const PHONE = "9958667744";

async function ensureSchool() {
  let school = await School.findOne({ schoolId: 999001 });

  if (!school) {
    school = await School.create({
      name: "Dev Test School",
      schoolId: 999001,
      type: "urban",
      boards: ["CBSE"],
      state: "Delhi",
      zone: "North",
      district: "Central",
      block: "Block A",
      mediums: ["en"],
      facilities: [],
      isDeleted: false,
    });
    console.log(`Created school ${school._id}`);
  } else {
    console.log(`Using existing school ${school._id}`);
  }

  return school;
}

async function upsertUser(schoolId) {
  const update = {
    name: "Dev User",
    state: "Delhi",
    zone: "North",
    district: "Central",
    block: "Block A",
    phone: PHONE,
    role: ["standard"],
    school: schoolId,
    preferredLanguage: "en",
    facilities: [],
    isProfileCompleted: false,
    classes: [],
    isDeleted: false,
    rememberMeToken: false,
    isLoginAllowed: true,
  };

  const user = await User.findOneAndUpdate(
    { phone: PHONE },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Seeded user ${user._id} for phone ${PHONE}`);
}

async function main() {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is required in .env");
  }

  await mongoose.connect(process.env.MONGO_URL);
  const school = await ensureSchool();
  await upsertUser(school._id);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
