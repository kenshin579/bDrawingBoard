/**
 * 파일 관련 Action
 */

define(['jquery', 'DrawingAction', 'Figure'],
    function($, DrawingAction, Figure) {
        var FileAction = function(tool) {
            var self = this;
            var fileData = {};

            /**
             * 로컬 파일 다운로드
             */
            this.saveLocalFile = function() {
                var aTag = document.createElement('a');
                aTag.download = 'drawingBoard_img.png';
                aTag.href = (tool.getCanvas()).toDataURL('image/png').replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
                aTag.click();
            };

                /**
             * 내 파일 저장 뷰
             * @param view
             */
            this.showSaveDialog = function(view) {
                if(view) {
                    $('#myfile-save').modal();
                }else {
                    $('#myfile-save').modal('hide');
                    $('#filesave-name').val("");
                }
            };

            /**
             * 내 파일 목록 뷰
             * @param view
             */
            this.showFileListDialog = function(view) {
                if(view) {
                    $('#myfile-list').modal();
                    self.getFileList();
                }else {
                    $('#myfile-list .div-list-file table').find('tr').removeClass('on');
                    $('#myfile-list .div-list-file table').find('tr').removeClass('click');
                    ($('#myfile-list .div-list-file table tbody')).html("");
                }
            };

            /**
             * 내 파일 저장
             * @param event
             */
            this.doSaveFile = function(event) {
                var file_name = $('#filesave-name').val();

                if(file_name != "") {
                    var file_data = self.getConversionDataToJson(tool.getData());

                    $.ajax({
                        type: 'POST',
                        url: '/save.do',
                        data: {"file_name": file_name, "file_data": file_data},
                        dataType: 'text',
                        success: function(result) {
                            if(result == 'success') {
                                alert("파일 저장이 완료되었습니다.");
                                self.showSaveDialog(false);
                            }else {
                                alert("파일 저장에 실패하였습니다.");
                            }
                        },
                        error: function() {
                            alert("파일 저장 오류입니다.\n해당 오류가 지속되면 관리자에게 문의하세요.");
                        }
                    });
                }else {
                    alert("파일명을 입력하세요.");
                }
            };

            /**
             * figure 객체 배열을 json 형태로 변환
             * @param dataArr
             * @returns {Array}
             */
            this.getConversionDataToJson = function(dataArr) {
                var data, jsonData = {}, jsonArr = [];
                for(var i=0; i<dataArr.length; i++) {
                    data = dataArr[i];
                    if(data != undefined) {
                        jsonData.type = data.getType();
                        jsonData.data = data.getData();
                        jsonData.strokeStyle = data.getStrokeStyle();
                        jsonData.lineWidth = data.getLineWidth();
                        jsonData.lineCap = data.getLineCap();
                        jsonData.fillStyle = data.getFillStyle();

                        jsonArr.push($.extend({}, jsonData));
                    }
                }

                return JSON.stringify(jsonArr);
            };

            /**
             * json 형태를 Figure 객체 배열로 변환
             * @param jsonData
             */
            this.getConversionJsonToData = function(jsonData) {
                var dataArr = JSON.parse(jsonData);

                for(var i=0; i<dataArr.length; i++) {
                    dataArr[i] = $.extend(new Figure, dataArr[i]);

                    dataArr[i].setType(dataArr[i].type);
                    dataArr[i].setData(dataArr[i].data);
                    dataArr[i].setStrokeStyle(dataArr[i].strokeStyle);
                    dataArr[i].setLineWidth(dataArr[i].lineWidth);
                    dataArr[i].setLineCap(dataArr[i].lineCap);
                    dataArr[i].setFillStyle(dataArr[i].fillStyle);
                }

                return dataArr;
            };

            /**
             * 내 파일 목록 불러오기
             */
            this.getFileList = function() {
                $.ajax({
                    type: 'GET',
                    url: '/getFileList.do',
                    dataType: 'json',
                    success: function(result) {
                        var appendHtml = "";
                        var listObj = result.myFileInfoList;

                        if(listObj != undefined){
                            for(var i=0; i<listObj.length; i++) {
                                appendHtml += "<tr class=\"list-file\">";
                                appendHtml += "<td class=\"depth-0\" id=\"td-file-" + listObj[i].file_id + "\">";
                                appendHtml += "<p class=\"list-name\">";
                                appendHtml += "<i class=\"tool-ico myfile-ico\"></i>" + decodeURIComponent(listObj[i].file_name).replace(/\+/g, ' ') + "</p>";
                                appendHtml += "<div class=\"list-btn\">";
                                appendHtml += "<a><i class=\"tool-ico savelocal-black-ico\"></i></a>"; // <!-- 다운로드 -->
                                appendHtml += "<a><i class=\"tool-ico editname-ico\"></i></a>"; // <!-- 이름변경 -->
                                appendHtml += "<a><i class=\"tool-ico drawclear-black-ico\"></i></a>"; // <!-- 삭제 -->
                                appendHtml += "</div></td></tr>";

                                fileData[listObj[i].file_id] = listObj[i].file_data;
                            }

                            $('#myfile-list .div-list-file').find('tbody').append(appendHtml);

                            // 내 파일 목록 이벤트
                            var myfile_list_tr = $('#myfile-list .div-list-file table tr');
                            myfile_list_tr.on('mousedown mouseover mouseup mousemove', function(event) {
                                self.onFileListEvent(event);
                            });
                        }
                    },
                    error: function() {
                        alert("파일 목록 조회 오류입니다.\n해당 오류가 지속되면 관리자에게 문의하세요.");
                    }
                });
            };

            /**
             * 내 파일 목록 이벤트
             * @param event
             */
            this.onFileListEvent = function(event) {
                if(event.type == 'mousedown') {
                    var fileDataIndex = $(event.target).parents('td').attr('id') == undefined ? $(event.target).attr('id').split('td-file-')[1] : $(event.target).parents('td').attr('id').split('td-file-')[1],
                        tdFile = $('#td-file-' + fileDataIndex),
                        tdFileName = tdFile.find('p').text();

                    if(event.target.tagName == 'P') {
                        // 파일 불러오기
                        $('#myfile-list').find('tr.click').removeClass('click');
                        $(event.currentTarget).addClass('click');

                        var dataArr = self.getConversionJsonToData(fileData[fileDataIndex]);
                        tool.setData(dataArr);

                        var drawingAction = new DrawingAction();
                        drawingAction.init(tool);

                        tool.getContext().clearRect(0, 0, tool.getCanvas().width, tool.getCanvas().height);
                        drawingAction.drawFigureByOrder('prev', tool.getData().length, false, true);
                        tool.getPen().setImageData(tool.getContext().getImageData(0,0,tool.getCanvas().width,tool.getCanvas().height));

                        $('#myfile-list').modal('hide');
                    }else if(event.target.className.indexOf("savelocal") > -1) {
                        // 파일 다운로드
                        var canvas = document.createElement('canvas');
                        canvas.width = document.getElementById('drawing-canvas').width;
                        canvas.height = document.getElementById('drawing-canvas').height;

                        var originDataArr = $.extend([], tool.getData());
                        var dataArr = self.getConversionJsonToData(fileData[fileDataIndex]);
                        tool.setCanvas(canvas);
                        tool.setData(dataArr);

                        var drawingAction = new DrawingAction();
                        drawingAction.init(tool);

                        drawingAction.drawFigureByOrder('prev', tool.getData().length, false, true);

                        var aTag = document.createElement('a');
                        aTag.download = tdFileName + '.png';
                        aTag.href = canvas.toDataURL('image/png').replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
                        aTag.click();

                        tool.setCanvas(document.getElementById('drawing-canvas'));
                        tool.setData(originDataArr);
                    }else if(event.target.className.indexOf("editname") > -1) {
                        // 파일 이름변경
                        var updateMyFileInfo = function(tdP, file_id, file_name, old_file_name) {
                            $.ajax({
                                type: 'POST',
                                url: '/updateMyFileInfo.do',
                                data : {"file_id" : file_id, "file_name" : file_name},
                                dataType: 'text',
                                success: function(result) {
                                    if (result == "success") {
                                        tdP.html('<i class="tool-ico myfile-ico"></i>' + file_name);
                                    }else {
                                        alert("파일명 수정이 실패하였습니다.");
                                        tdP.html('<i class="tool-ico myfile-ico"></i>' + old_file_name);
                                    }
                                }
                            });
                        };

                        tdFile.find('p').html('<i class="tool-ico myfile-ico"></i><input type="text" class="td-file-edit" value="'+ tdFileName +'" />');

                        tdFile.find('p > input').on('keydown blur', function(event) {
                            if(event.type == 'keydown' && event.keyCode == 13 //enter key
                                || event.type == 'blur') {
                                updateMyFileInfo(tdFile.find('p'), fileDataIndex, $('.td-file-edit').val(), tdFileName);
                            }
                        });
                    }else if(event.target.className.indexOf("drawclear") > -1) {
                        // 파일 삭제
                        if(confirm("파일을 삭제하겠습니까?")) {
                            $.ajax({
                                type: 'POST',
                                url: '/deleteMyFileInfo.do',
                                data : {"file_id" : fileDataIndex},
                                dataType: 'text',
                                success: function(result) {
                                    if (result == "success") {
                                        tdFile.parent('tr').hide();
                                    }else {
                                        alert("파일 삭제에 실패하였습니다.");
                                    }
                                }
                            });
                        }
                    }
                }else if(event.type == 'mouseover') {
                    $('#myfile-list').find('tr.on').removeClass('on');
                    $(event.currentTarget).addClass('on');
                }
            }

        };

        return FileAction;
});