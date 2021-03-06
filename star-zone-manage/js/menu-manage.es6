var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            isCollapse: false,
            dialogVisible: false,
            menus: [],
            subMenus: [],
                defaultProps: {
                    children: 'children',
                    label: 'label'
                },
                treeloading: false,
                action: '',
                formMenuLabel: '',
                formMenuUrl: '',
                currentNode: {
                    id:null,
                    label:'',
                    level:0,
                    parentId:null,
                    url:null
            }
        }
    },
    methods: {
        showAddForm() {
            this.action = 'add'
            this.dialogVisible = true;
        },
        showModifyForm(){
            this.action = 'modify'

            this.formMenuLabel = this.currentNode.label
            this.formMenuUrl = this.currentNode.url

            this.dialogVisible = true;
        },
        hideForm() {
            this.action = ''
            this.formMenuLabel = null
            this.formMenuUrl = null
            this.dialogVisible = false
        },
        cancelForm() {
            this.formMenu = {
                id: '',
                label: '',
                menuOrder: '',
                url: '',
                isValid: true
            };

            this.hideForm()
        },
        resetChecked() {
            this.$refs.tree.setCheckedKeys([]);
        },
        handleClose() {
            this.dialogVisible = false;
        },
        getTree(){
            axios.get(ctxPath + 'api/menu/gettree').then(function (response) {
                vm.menus = response.data.result;
            }).catch(function (error) {
                console.log(error);
            });
        },
        treeClick(data,node,obj){

            //console.log(data);

            var keys = this.$refs.tree.getCheckedKeys();
            var id = data.id;

            if(keys.length == 0){
                this.$refs.tree.setCheckedKeys([id]);

                this.currentNode = data;
            }else{

                if(keys.indexOf(id) >= 0){
                    this.$refs.tree.setCheckedKeys([]);
                    this.currentNode = {
                        id:null,
                        label:'',
                        level:0,
                        parentId:null,
                        url:null
                    }
                }else{
                    this.$refs.tree.setCheckedKeys([id]);
                    this.currentNode = data;
                }
            }
        },
        treeChange(data,ischeck,issubcheck){
            var id = data.id;

            if(ischeck){
                this.$refs.tree.setCheckedKeys([id]);
                this.currentNode = data;
            }
        },
        submitForm(){
            if(this.action == 'add'){
                this.addMenu()
            }else if(this.action == 'modify'){
                this.modifyMenu();
            }
        },
        addMenu(){
            axios.get(ctxPath + 'api/menu/add', {
                params: {
                    parentId: this.currentNode.id,
                    label: this.formMenuLabel,
                    url: this.formMenuUrl,
                    level: this.currentNode.level+1,
                    valid: true
                }
            }).then(function (response) {
                vm.getTree()
                vm.hideForm()

                vm.resetChecked()
            }).catch(function (error) {
                console.log(error);
            });
        },
        modifyMenu(){
            axios.get(ctxPath + 'api/menu/modify', {
                params: {
                    id: this.currentNode.id,
                    label: this.formMenuLabel,
                    url: this.formMenuUrl
                }
            }).then(function (response) {
                vm.getTree()
                vm.hideForm()

                vm.resetChecked()
            }).catch(function (error) {
                console.log(error);
            });
        },
        delMenu(){

            this.$confirm('此操作将删除导航'+this.currentNode.label+', 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                axios.get(ctxPath +'api/menu/delete', {
                    params: {
                        id: this.currentNode.id
                    }
                }).then(function (response) {
                    vm.getTree()
                    vm.hideForm()

                    vm.resetChecked()
                }).catch(function (error) {
                    console.log(error);
                });
            }).catch(() => {
                /*this.$message({
                    type: 'info',
                    message: '已取消删除'
                });*/
            });
        },
        moveUp(){
            this.treeloading = true;

            axios.get(ctxPath + 'api/menu/move', {
                params: {
                    id: this.currentNode.id,
                    direction: -1
                }
            }).then(function (response) {
                vm.getTree()
                vm.hideForm()

                vm.resetChecked()

                vm.treeloading = false;
            }).catch(function (error) {
                console.log(error);
                vm.treeloading = false;
            });

        },
        moveDown(){
            this.treeloading = true;

            axios.get(ctxPath + 'api/menu/move', {
                params: {
                    id: this.currentNode.id,
                    direction: 1
                }
            }).then(function (response) {
                vm.getTree()
                vm.hideForm()
                vm.resetChecked()

                vm.treeloading = false;
            }).catch(function (error) {
                console.log(error);

                vm.treeloading = false;
            });

        }
    },
    computed:{
        canAdd:function(){
            return this.currentNode.id!=null && this.currentNode.level != 2
        },
        canModify:function(){
            return this.currentNode.id!=null && this.currentNode.id != -1
        },
        canDel: function(){
            //这里后面改用isLeaf实现
            return this.currentNode.id!=null &&
                (
                    this.currentNode.level==2
                    || (this.currentNode.level==1
                        && (this.currentNode.children == null || this.currentNode.children.length==0))
                )
        },
        canSubmit:function(){
            return this.formMenuLabel!=null && this.formMenuUrl!=null && this.formMenuLabel.length>0 && this.formMenuUrl.length>0
        },
        canMoveUp:function(){
            if(this.currentNode.id!=null && this.currentNode.id != -1){//选择了节点并且不是根节点
                var level = this.currentNode.level;
                if(level == 1){
                    if(this.menus[0].children[0].id == this.currentNode.id){//说明选择了第一个元素，不能上移
                        return false;
                    }else{
                        return true;
                    }
                }else if(level == 2){
                    var parentId = this.currentNode.parentId;

                    var parentNode = null;

                    for(var i=0;i<this.menus[0].children.length;i++){
                        if(this.menus[0].children[i].id == parentId){
                            //console.log(true)
                            parentNode = this.menus[0].children[i]
                        }
                    }

                    var children = parentNode.children

                    if(children[0].id == this.currentNode.id){
                        return false;
                    }else{
                        return true
                    }
                }
            }else{
                return false
            }
        },
        canMoveDown:function(){
            if(this.currentNode.id!=null && this.currentNode.id != -1){//选择了节点并且不是根节点
                var level = this.currentNode.level;
                if(level == 1){
                    var lastIndex = this.menus[0].children.length-1
                    if(this.menus[0].children[lastIndex].id == this.currentNode.id){//说明选择了最后一个元素，不能下移
                        return false;
                    }else{
                        return true;
                    }
                }else if(level == 2){
                    var parentId = this.currentNode.parentId;

                    var parentNode = null;

                    for(var i=0;i<this.menus[0].children.length;i++){
                        if(this.menus[0].children[i].id == parentId){
                            parentNode = this.menus[0].children[i]
                        }
                    }

                    var children = parentNode.children
                    var lastIndex = children.length-1

                    if(children[lastIndex].id == this.currentNode.id){
                        return false
                    }else{
                        return true
                    }
                }
            }else{
                return false
            }
        },
        handleOpen(key, keyPath) {
            //console.log(key, keyPath);
        },
        handleClose(key, keyPath) {
           // console.log(key, keyPath);
        }
    }
})

vm.getTree();