/**
 * @author wudx
 * @version 1.0
 */

$.fn.treegrid = function(options, param){
	//options 为字符串视为方法调用，为object 为初始化
	if (typeof options == 'string'){
		return $.fn.treegrid.methods[options](this, param);
	}else{
		return $.fn.treegrid.methods.init(this, options);;
	}
}

$.fn.treegrid.methods = {
    options : {
        idField : 'id',
        width: "800",			//宽度
        headerAlign: "left",	
        headerHeight: "30",
        dataAlign: "left",
        indentation: "20",
        folderOpenIcon: "./js/TreeGrid/images/folderOpen.png",
        folderCloseIcon: "./js/TreeGrid/images/folderClose.png",
        defaultLeafIcon: "./js/TreeGrid/images/defaultLeaf.gif",
        hoverRowBackground: "false",
        folderColumnIndex: "1",
        treeField: "name",
        url : '',
        jq : '',
        columns : [], 
        data : {},
        tableId : '',
        
        //定义事件，行单单击事件
        onClickRow : function(rowIndex, rowData){},
    },
    
    init : function(jq, options){
        var that = this;
        this.jq = jq;
        //that.options.onClickRow = MyTreeGrid.onClickRow;
        //加载表格头信息
        var domOption = $(jq).attr('data-options');
        if(domOption){
            eval("domOption={" + domOption + "}");
            $.each(domOption, function(i,item){
                that.options[i] = item;
            })
        }
        
        //加载表格列信息
        $(jq).find("thead tr th").each(function(i, item){
            var text = $(item).text();
            domColumns = $(item).attr('data-options');
            if(domColumns){
                eval("domColumns={" + domColumns + "}");
                domColumns.text = text;
                that.options.columns.push(domColumns);
            }
        })
        
        if(options){
            $.each(options, function(i,item){
                that.options[i] = item;
            })
        }
        
        that.options.tableId = MyTreeGrid.createTreeGrid(jq, that.options);
        //MyTreeGrid.init(jq, that.options);
        
        that.loadData();
        return this;
    },
    

    /**
     * 加载数据
     */
    loadData : function(jq, param){
        var that = this;
        var options = that.options;
        if(param){
            if( typeof param == 'string' ){
                //加载数据
            }else{
                options.data = param;
            }
        }
        
        var html = MyTreeGrid.createRowData(options.data, options, 1, 0);
        $("#" + that.options.tableId).find("tbody").empty().append($(html));
    },
    
    /**
     * 获取当前选择项的值
     */
    getSelected : function(jq, param){
        var that = this;
        var options = that.options;
        var rowData = null;
        
        if(options._selectId){
            rowData = MyTreeGrid.getRowData(options._selectId, options);
        }
        
        return rowData;
    }
}

MyTreeGrid = {
        
    init : function(jq, options){
        var that = this;
        var table = $("#"+options.tableId);
        
        //定义行单击事件
        table.on('click', 'tr', function(){
            var rowIndex = $(this).attr('rowindex');
            var selectId = $(this).attr('id');
            if($(this).hasClass("row_active")){
                $(this).removeClass("row_active");
                options._selectIndex = null;
                options._selectId = null;
            }else{
                $(this).addClass("row_active").siblings().removeClass("row_active");
                
                options._selectIndex = rowIndex;
                options._selectId = selectId;
            }
            
            var rowData = that.getRowData(selectId, options);
            options.onClickRow(rowIndex, rowData);
        });
        
        //定义行展开、关闭下级节点
        table.on('click', "img[folder='Y']", function(){
            var trid = $(this).attr("trid");
            var isOpen = table.find("#" + trid).attr("opend");
            isOpen = (isOpen == "Y") ? "N" : "Y";
            table.find("#" + trid).attr("opend", isOpen);
            that.showHiddenNode(table,trid, isOpen, options);
        });

    },
    
    //显示或隐藏子节点数据
    showHiddenNode : function(table,_trid, _open, options){
        var that = this;
        if(_open == "N"){ //隐藏子节点
            table.find("#"+_trid).find("img[folder='Y']").attr("src", options.folderCloseIcon);
            //table.find("tr[id^=" + _trid + "_]").css("display", "none");
            that.hiddenSubs(table, _trid);
        }else{ //显示子节点
            table.find("#"+_trid).find("img[folder='Y']").attr("src", options.folderOpenIcon);
            that.showSubs(table, _trid);
        }
    },

    //递归检查下一级节点是否需要显示
    showSubs : function(table, _trid){
        var that = this;
        var isOpen = table.find("#" + _trid).attr("opend");
        if(isOpen == "Y"){
            var trs = table.find("tr[pid=" + _trid + "]");
            trs.css("display", "");
            
            for(var i=0;i<trs.length;i++){
                that.showSubs(table, trs[i].id);
            }
        }
    },
  //递归检查下一级节点是否需要显示
    hiddenSubs : function(table, _trid){
        var that = this;
        var isOpen = table.find("#" + _trid).attr("opend");
        var trs = table.find("tr[pid=" + _trid + "]");
        trs.css("display", "none");
        
        for(var i=0;i<trs.length;i++){
            that.hiddenSubs(table, trs[i].id);
        }
    },

    getRowData : function(id, options){
        var that = this;
        var table = $('#' + options.tableId);
        var pid = table.find('#'+id).attr('pid');
        var rowData = {};
        //
        if(pid != 0){
            var pdata = that.getRowData(pid, options);
            $.each(pdata.children, function(i, item){
                if(item[options['idField']] == id){
                    rowData = item;
                }
            })
        }else{
            $.each(options.data, function(i, item){
                if(item[options['idField']] == id){
                    rowData = item;
                }
            })
        }
        return rowData;
    },
    
    /**
     * 创建表格
     */
    createTreeGrid : function(jq, options){
        var that = this;
        $(jq).hide();
        var tableId = $(jq).attr('id');
        if($("#tree_grid_" + tableId).length <= 0){
            if(tableId){
                tableId = "tree_grid_" + tableId;
            }else{
                var tid = 0;
                do{
                    tableId = "tree_grid_" + tid;
                }while($("#" + tableId).length <=0);
            }
            
            var html = "<table id='" + tableId + "' cellspacing=0 cellpadding=0 width='" + (options.width || "100%") + "' class='TreeGrid datagrid selectSingle table table-hover table-bordered table-striped'>";
            html += "<thead>";
            html += that.createThead(jq, options);
            html += "</thead>";
            html += "<tbody></tbody>";
            html += "</table>";
            
            $(jq).before($(html));
            options['tableId'] = tableId;
            that.init(jq, options);
        }else{
            tableId = "tree_grid_" + tableId;
        }
        return tableId;
    },

    /**
     * 创建表头
     */
    createThead : function(jq, options){
        var html = "<tr class='header' height='" + (options.headerHeight || "30") + "'>";
    
        //遍历表头设置
        for(var i = 0; i < options.columns.length; i++){
            var col = options.columns[i];
            html += "<th ";
            if(col.hidden){
                html += "style='display:none' ";
                
            }
            html +=  "align='" + (col.headerAlign || options.headerAlign || "left") + "' width='" + (col.width || "") +"'>" + (col.text || "") + "</th>";
        }
        html += "</tr>";
        
        return html;
    },
    
    rownum : 0,
    
    /**
     * 递归创建表格数据
     */
    createRowData : function(_rows, options, _level, _pid){
        var that = this;
        var treeField = options.treeField;
        var _cols = options.columns;
        
        var html = "";
        for(var i = 0; i < _rows.length; i++){
            var row = _rows[i];
            var id = row[options['idField']]; //行id
            
            html += "<tr id='" + id + "' pid='" + _pid + "' opend='Y' rowIndex='" + that.rownum++ + "'>";
            for(var j = 0; j <_cols.length;j++){
                var col = _cols[j];
                if(col.checkbox){
                    html += "<td class='table-ckeckbox'><input type='checkbox' name='" + col.field + "' value='" + row[col.field] + "'></td>";
                }else{
                    html += "<td align='" + (col.dataAlign || options.dataAlign || "left") + "'";
                    
                    //判断是否为树字段，如果是，则创建缩进
                    if(col['field'] == options['treeField']){
                        html += " style='text-indent:" + (parseInt((options.indentation || "20"))*(_level-1)) + "px;'";
                    }
                    html += ">";
                    
                    //节点图标
                    if(col['field'] == options['treeField']){
                        if(row.children){ //有下级数据
                            html += "<img folder='Y' trid='" + id + "' src='" + options.folderOpenIcon + "' class='image_hand'>";
                        }else{
                            html += "<img src='" + options.defaultLeafIcon + "' class='image_nohand'>";
                        }
                    }
                    
                    //单元格内容
                    if(col.handler){
                        html += (eval(col.handler + ".call(new Object(), row, col)") || "") + "</td>";
                    }else{
                        html += (row[col.field] || "") + "</td>";
                    }
                    
                }
            }
            html += "</tr>";

            //递归显示下级数据
            if(row.children){
                html += that.createRowData(row.children, options, _level+1, id);
            }
        }
        
        //返回每一行的数据
        return html;
    }
}