import express from "express"
import errorHandling from "../Middlewares/ErrorHandling.js"
import Roles from "../Modules/Roles.js";
const router = express.Router();

router.post("/addRole", errorHandling(async (req, res) => {
    const { role, permissions } = req.body;

    const newRoles = new Roles({
        role, permissions
    });

    await newRoles.save();
    res.status(201).json(newRoles);
}));

// GET /api/category
router.get("/allRoles", async (req, res) => {
    try {
        const RolesData = await Roles.find()

        res.status(200).json(RolesData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put("/updateRole/:id", errorHandling(async (req, res) => {
    const { role, permissions } = req.body;

    let updateRoleData = {};
    if (role) updateRoleData.role = role;
    if (permissions) updateRoleData.permissions = permissions;
    const updatedRole = await Roles.findByIdAndUpdate(
        req.params.id,
        { $set: updateRoleData },
        { new: true }
    );

    res.json(updatedRole);
}));

router.delete("/delRole/:id", errorHandling(async (req, res) => {
    const DelRole = await Roles.findByIdAndDelete(req.params.id);
    if (!DelRole) {
        return res.status(404).json({ message: "Game not found" });
    }
    res.json({ message: "Game deleted successfully" });
}));

export default router;