import express from "express"
import errorHandling from "../Middlewares/ErrorHandling.js";
import bcrypt from "bcrypt"
import User from "../Modules/User.js";
const router = express.Router()

const adminUser = async () => {
    const adminName = "Admin User"
    const adminEmail = "softseedssolution@gmail.com"
    const adminPassword = "1234"
    const checkAdmin = await User.findOne({ email: adminEmail })
    if (checkAdmin) return null;
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "Admin"
    })
}

adminUser()

router.post("/addUser", errorHandling(async (req, res) => {
    const { name, email, password, confirmPassword, number, role } = req.body
    if (!name || !email || !password || !confirmPassword || !number || !role) return res.status(400).json({ message: "Fields with * are required" })

    const [checkEmail, checkNumber] = await Promise.all([
        User.findOne({ email }),
        User.findOne({ number })
    ])
    if (checkEmail) return res.status(400).json({ message: "Email already exists" })
    if (checkNumber) return res.status(400).json({ message: "Number already exists" })
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords don't match" })

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await User.create({ name, email, password: hashedPassword, number, role })
    res.json(newUser)
}))

router.post("/signIn", errorHandling(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" })
    const checkUser = await User.findOne({ email }).populate("role")
    if (!checkUser) return res.status(400).json({ message: "Email did not match" })

    const checkPassword = await bcrypt.compare(password, checkUser.password)
    if (!checkPassword) return res.status(400).json({ message: "Incorrect Password" })
    res.json(checkUser)
}))

router.get("/getUser", errorHandling(async (req, res) => {
    const allUsers = await User.find().populate("role")
    res.json(allUsers)
}))

router.get("/getUserById/:id", errorHandling(async (req, res) => {
    const getUserById = await User.findById(req.params.id).populate("role")
    if (!getUserById) return res.status(400).json({ message: "User not found" })
    res.json(getUserById)
}))

router.get("/titleUser/:title", errorHandling(async (req, res) => {
    const getUserByTitle = await User.findOne({ name: req.params.title })
    if (!getUserByTitle) return res.status(400).json({ message: "User not found" })
    res.json(getUserByTitle)
}))

router.delete("/delUser/:id", errorHandling(async (req, res) => {
    const delUserById = await User.findByIdAndDelete(req.params.id)
    if (!delUserById) return res.status(400).json({ message: "User not found" })
    res.json("User successfully deleted")
}))

router.get("/userCount", errorHandling(async (req, res) => {
    const userCount = await User.countDocuments()
    res.json(userCount)
}))

router.put("/updateUser/:id", errorHandling(async (req, res) => {

    const { name, email, password, number, role } = req.body;

    const changeUser = {};

    if (name) changeUser.name = name;

    if (email) changeUser.email = email;

    // ✅ only hash if password exists
    if (password) {
        const hashPassword = await bcrypt.hash(password, 10);
        changeUser.password = hashPassword;
    }

    if (number) changeUser.number = number;

    if (role) changeUser.role = role;

    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: changeUser },
        { new: true }
    ).populate("role");

    if (!updatedUser) {
        return res.status(400).json({ message: "User not found" });
    }

    res.json(updatedUser);

}));

export default router;