const multer = require("multer");
const storage=multer.memoryStorage();
const upload=multer({
    storage:storage,
    limits:{fileSize:5*1024*1025}
});
module.exports=upload