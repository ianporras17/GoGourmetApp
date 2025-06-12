const router = require('express').Router();
const auth = require('../middlewares/auth');
const { create, list, listMine, remove, show, update} =
        require('../controllers/experiencesController');

router.get('/',         list);
router.get('/mine',     auth, listMine);     
router.post('/',        auth, create);   
router.get('/:id',    show);    
router.delete('/:id',   auth, remove); 
router.put('/:id',     auth, update);  

module.exports = router;
