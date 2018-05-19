function testButtonClicked() {
    // F 2, F 1:0, output, carryon
    //renderGateValue(["1", "01", "0", "125"]);

    //a b carry-in
    renderConsole("dfasdfg")
    //A, B, output, carry, l
    //renderAdderAdder([1, 1, 0, 1], [1, 0, 1, 1], [1, 0, 0, 1], [1, 0, 1, 0], [3, 5]);
    // var a = ALU.render_gates()
    // renderAdderAdder(a[0],a[1],a[2],a[3])
    // renderCUValues([0, 0, 0, 0, 0, 0, 0]);
    // // renderDatapath([3, 102]);
    // //resetButtonClicked()
    // // var i = 4;
    // arr = analyzeall(data)
    // console.log("arr set to ", arr)
    // PROGRAM_COUNTER = 0;
    // MIPS.set(arr[i].bit)
    // MIPS.run()
    // MIPS.print()

    // var r = MIPS.render()
    // renderDatapath(r)


}

function assembleButtonClicked() {
    resetButtonClicked();
    var editorText = codeEditor.getValue();
    callAssemblyAPI(editorText);
}

function stepButtonClicked() {
    if (PROGRAM_COUNTER < arr.length) {
        removeTemps();

        console.log("counter+", PROGRAM_COUNTER)

        MIPS.set(arr[PROGRAM_COUNTER].bit)
        MIPS.run()
        MIPS.print()


        simulate(arr[PROGRAM_COUNTER]);
        renderRegisterValues(Registers.getRegs())

        // First layer
        var r = MIPS.renderpaths()
        renderDatapath(r)

        var n = MIPS.rendernums()
        renderCUValues(n)


        // Second layer
        renderGateDatapath(ALU.render())

        renderGateValue(ALU.render_value())

        // Third layer
        var a = ALU.render_gates()
        renderAdderAdder(a[0], a[1], a[2], a[3], a[4])
        renderAdderValue(a[5])
        // Forth layer
        renderTransistor(Adder2.A, Adder2.B, Adder2.CarryIn)


        PROGRAM_COUNTER++;
        renderAssemblyHighlight(PROGRAM_COUNTER)

        // console.log("ALUrender", ALU.render())

    } else {
        alert("The End!")
    }
}

function resetButtonClicked() {
    PROGRAM_COUNTER = 0;
    renderAssemblyNoHighlight();
    removeTemps();
    resetRegisterDivs();
    renderCUValues(['', '', '', '', '', '', '']);
    // PROGRAM_COUNTER = 0;

}

function removeTemps() {
    $("#svgTemp").children().remove();
    $("#gateTemp").children().remove();
    $("#adderTemp").children().remove();
    $("#transTemp").children().remove();
}

function callAssemblyAPI(editorText) {
    var url = "https://godbolt.org/api/compiler/mips5/compile";
    var myJSON = {
        "source": editorText,
        "compiler": "mips5",
        "options": {
            "userArguments": "",
            "compilerOptions": {
                "produceGccDump": {},
                "produceCfg": false
            },
            "filters": {
                "binary": false,
                "execute": false,
                "labels": true,
                "directives": true,
                "commentOnly": true,
                "trim": true,
                "intel": true,
                "demangle": true
            }
        },
        "lang": "c++"
    }

    //call assembly language api
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: url,
        dataType: "json",
        data: JSON.stringify(myJSON),
        success: function(result) {
            //ada display assembly code on screen
            //undefined
            var resultString = "";
            for (var i = 0; i < result.asm.length; i++) {
                // if (result.asm[i].text != null) {
                if (result.asm[i].text) {
                    returnString = result.asm[i].text
                    tempstring = returnString.replace(/ /g, '');
                    //Ignore nop instruction
                    if (tempstring != "nop") {
                        resultString += result.asm[i].text;
                        resultString += "\n";
                    }
                }
            }
            assemblyEditor.setValue(resultString);
            arr = analyzeall(result);
        }
    })
}


/************** Console *********/
function renderConsole(loglog){
  $("#consoleLogText").text(loglog);
}
/************** Assembly *********/
function renderAssemblyHighlight(divIndex) {
    codeDivs = $('#assemblyEditor .CodeMirror-code').children();
    codeDivs.css("background-color", "white");
    $(codeDivs[divIndex]).css("background-color", "#FFF70A")
}

function renderAssemblyNoHighlight() {
    codeDivs = $('#assemblyEditor .CodeMirror-code').children();
    codeDivs.css("background-color", "white");
}

/*************** Microarchitecture *****************/

function renderRegisterValues(registerValues) {
    var registerDiv = $(".register");
    for (var i = 0; i < registerDiv.length; i++) {
        if (registerDiv[i].innerHTML != registerValues[i]) {
            registerDiv[i].innerHTML = registerValues[i];
            var registerFile = $("#registerFile").children()[i];
            drawSVGRect("svgTemp", registerFile.x.animVal.value, registerFile.y.animVal.value);
        }
    }
}

function renderDatapath(datapathArray) {
    for (var i = 0; i < datapathArray.length; i++) {
        var datapathIndex = datapathArray[i];
        if (datapathIndex > 99) {
            datapathIndex %= 100;
            forDatapathPoly("polylines", "svgTemp", "red", datapathIndex);
        } else {
            forDatapath("lines", "svgTemp", "red", datapathIndex);
        }
    }
}

function renderCUValues(CUValues) {
    var t = $(".CU");
    for (var i = 0; i < 7; i++) {
        t[i].innerHTML = CUValues[i];
    }
}

/****************** ALU ***********************/
function renderGateValue(gateValues) {
    var gateText = $("#gateText").children();
    for (var i = 0; i < gateValues.length; i++) {
        gateText[i].innerHTML = gateValues[i];
    }

}

function renderGateDatapath(datapathArray) {
    for (var i = 0; i < datapathArray.length; i++) {
        var datapathIndex = datapathArray[i];
        if (datapathIndex > 99) {
            datapathIndex %= 100;
            forDatapathPoly("gatePoly", "gateTemp", "red", datapathIndex);
        } else {
            forDatapath("gateLine", "gateTemp", "red", datapathIndex);
        }
    }
}
/********************* Adder ************************/
function renderAdderAdder(A, B, output, carry, l) {
    var adderText = $("#adderText").children();
    for (var i = 0; i < output.length; i++) {
        if (output[i] == 1) {
            forDatapath("adderNoLit", "adderTemp", "#25ebd1", i);
        }
        if (A[i] == 1) {
            forDatapath("adderNoLit", "adderTemp", "#25ebd1", i + 4)
        }
        if (B[i] == 1) {
            forDatapath("adderNoLit", "adderTemp", "#25ebd1", i + 8)
        }
        adderText[i].innerHTML = output[i];
        adderText[i + 4].innerHTML = A[i];
        adderText[i + 8].innerHTML = B[i];
    }
    for (var i = 0; i < carry.length; i++) {
        if (carry[i] == 1) {
            forDatapath("adderLine", "adderTemp", "#25ebd1", 2 - i);
        }
    }
    for (var i = 0; i < l.length; i++) {
        var ttl = l[i];
        if (ttl != 13) {
            forDatapath("carryLine", "adderTemp", "#25ebd1", ttl);
        } else {
            forDatapathPoly("carryLine", "adderTemp", "#25ebd1", ttl);
        }
    }


}

function renderAdderValue(source){
  var adderText = $("#adderText").children();
  adderText[13].innerHTML = source[0];
  adderText[15].innerHTML = source[1];
}


/******************* Transistor ******************/
//Show the status of 1st Adder in the Transistor level
function renderTransistor(a, b, c) {
  var transText = $("#transText").children();
transText[1].innerHTML = a;
transText[3].innerHTML = b;
transText[5].innerHTML = c;

    if (a == 1) {
        var achildren = $("#a").children();
        for (var i = 0; i < achildren.length; i++) {
            forDatapath("a", "transTemp", "#6DBE45", i)
        }
    }
    if (b == 1) {
        var bchildren = $("#b").children();
        for (var i = 0; i < bchildren.length; i++) {
            forDatapath("b", "transTemp", "#6DBE45", i)
        }
    }
    if (c == 1) {
        var cchildren = $("#c").children();
        for (var i = 0; i < cchildren.length; i++) {
            forDatapath("c", "transTemp", "#6DBE45", i)
        }
    }

    if (a == 1 && b == 1 && c == 1) {
        forDatapathPoly("transLines", "transTemp", "#6DBE45", 26);
        forDatapathPoly("transLines", "transTemp", "#6DBE45", 44);
    }
    if (a == 1 && b == 1 && c == 0) {
        forDatapathPoly("transLines", "transTemp", "#6DBE45", 25);
        forDatapathPoly("transLines", "transTemp", "#6DBE45", 12);
        forDatapathPoly("transLines", "transTemp", "#6DBE45", 36);
        forDatapathPoly("transLines", "transTemp", "#6DBE45", 47);

        forDatapathPoly("transLines", "transTemp", "#6DBE45", 29);
        forDatapathPoly("transLines", "transTemp", "#6DBE45", 5);
        forDatapathPoly("transLines", "transTemp", "#6DBE45", 6);
        forDatapath("transLines", "transTemp", "#6DBE45", 39);
        forDatapathPoly("transLines", "transTemp", "#6DBE45", 44);
    }
    if (a == 0 && b == 1 && c == 1) {
        var polyarr = [0, 1, 12, 28, 31, 32, 25, 35, 36, 37, 5, 6, 44, 47];
        for (var i = 0; i < polyarr.length; i++) {
            forDatapathPoly("transLines", "transTemp", "#6DBE45", polyarr[i]);

        }
        forDatapath("transLines", "transTemp", "#6DBE45", 39);
    }
    if (a == 0 && b == 1 && c == 0) {
        var polyarr = [0, 1, 28, 31, 32, 5, 2, 4, 9, 11, 26, 29, 43, 45];
        for (var i = 0; i < polyarr.length; i++) {
            forDatapathPoly("transLines", "transTemp", "#6DBE45", polyarr[i]);
        }
        forDatapath("transLines", "transTemp", "#6DBE45", 42);
    }
    if (a == 1 && b == 0 && c == 1) {
        var polyarr = [1, 5, 6, 12, 25, 27, 30, 35, 36, 44, 47];
        for (var i = 0; i < polyarr.length; i++) {
            forDatapathPoly("transLines", "transTemp", "#6DBE45", polyarr[i]);
        }
        forDatapath("transLines", "transTemp", "#6DBE45", 39);
    }
    if (a == 1 && b == 0 && c == 0) {
        var polyarr = [1, 27, 30, 41, 5, 2, 4, 9, 11, 26, 29, 43, 45];
        for (var i = 0; i < polyarr.length; i++) {
            forDatapathPoly("transLines", "transTemp", "#6DBE45", polyarr[i]);
        }
        forDatapath("transLines", "transTemp", "#6DBE45", 42);
    }

    if (a == 0 && b == 0 && c == 1) {
        var polyarr = [0, 1, 3, 4, 5, 7, 11, 26, 27, 28, 30, 31, 32, 33, 41, 43, 45];
        for (var i = 0; i < polyarr.length; i++) {
            forDatapathPoly("transLines", "transTemp", "#6DBE45", polyarr[i]);
        }
        forDatapath("transLines", "transTemp", "#6DBE45", 42);
    }
    if (a == 0 && b == 0 && c == 0) {
        var polyarr = [0, 1, 2, 3, 4, 5, 7, 9, 11, 25, 27, 28, 29, 30, 31, 32, 33, 34, 36, 43, 45];
        for (var i = 0; i < polyarr.length; i++) {
            forDatapathPoly("transLines", "transTemp", "#6DBE45", polyarr[i]);
        }
        forDatapath("transLines", "transTemp", "#6DBE45", 39);
        forDatapath("transLines", "transTemp", "#6DBE45", 42);
        forDatapath("transLines", "transTemp", "#6DBE45", 48);

    }
}

/******************* SVG ******************/
function forDatapath(divID, renderID, color, lineindex) {
    var datapath = $("#" + divID).children()[lineindex];
    // console.log(datapath);
    drawSVGLine(renderID, color, datapath.x1.animVal.value, datapath.y1.animVal.value, datapath.x2.animVal.value, datapath.y2.animVal.value)
}

function forDatapathPoly(divID, renderID, color, polyindex) {
    var datapath = $("#" + divID).children()[polyindex].points;
    //console.log(datapath);
    var datapoints = '';
    for (var i = 0; i < datapath.length; i++) {
        datapoints += datapath[i].x;
        datapoints += ",";
        datapoints += datapath[i].y;
        datapoints += " ";
    }
    drawSVGPolyline(renderID, datapoints, color);
    //drawSVGPolyline("20,30 400,200 300,100");
}

function forPolygon(divID, renderID, index) {
    var datapath = $("#" + divID).children()[index].points;
    var datapoints = '';
    for (var i = 0; i < datapath.length; i++) {
        datapoints += datapath[i].x;
        datapoints += ",";
        datapoints += datapath[i].y;
        datapoints += " ";
    }
    drawSVGPolygon(renderID, datapoints);
}

function SVG(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}


function drawSVGPolyline(ID, datapoints, color) {
    var $svg = $("#" + ID);
    $(SVG('polyline'))
        .attr('points', datapoints)
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('fill', 'none')
        .attr('stroke-miterlimit', 10)
        .appendTo($svg);
}

function drawSVGRect(ID, x, y) {
    var $svg = $("#" + ID);
    $(SVG('rect'))
        .attr('x', x)
        .attr('y', y)
        .attr('width', 30)
        .attr('height', 15)
        .attr('stroke', "red")
        .attr('fill', 'none')
        .attr('stroke-miterlimit', 10)
        .appendTo($svg);
}

function drawSVGLine(ID, color, x1, y1, x2, y2) {
    var $svg = $("#" + ID);
    $(SVG('line'))
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', color)
        .attr('stroke-miterlimit', 10)
        .attr('stroke-width', 3)
        .appendTo($svg);
};

function drawSVGPolygon(ID, datapoints) {
    var $svg = $("#" + ID);
    $(SVG('polygon'))
        .attr('points', datapoints)
        .attr('fill', 'none')
        .attr('stroke', "green")
        .attr('stroke-miterlimit', 10)
        .attr('stroke-width', 3)
        .appendTo($svg);
};

function createRegisterDivs() {
    var registerFile = document.getElementById("registerFile");
    var startX = $(window).width() * 0.3 + 10 + registerFile.children[0].x.animVal.value;
    var startY = 12 + registerFile.children[0].y.animVal.value;
    var svgContainer = $(".svgDiv");
    for (var i = 7; i >= 0; i--) {
        for (var j = 3; j >= 0; j--) {
            var myX = startX + j * 40;
            var myY = startY + i * 20;
            $("<div/>", {
                "class": "register",
                text: "000",
                style: "position:absolute; left:" + myX + "px; top:" + myY + "px; width:30px;"
            }).prependTo(svgContainer);
        }
    }
    var divPosX = [315, 455, 495, 529, 602, 671, 800]
    var divPosY = [209, 412, 319, 257, 169, 255, 345]
    for (var i = 0; i < 7; i++) {
        var myX = $(window).width() * 0.3 + divPosX[i];
        var myY = 55 + divPosY[i];
        $("<div/>", {
            "class": "CU",
            text: "",
            style: "position:absolute; left:" + myX + "px; top:" + myY + "px; width:30px;"
        }).appendTo(svgContainer);
    }


}

function resetRegisterDivs() {
    var svgContainer = $(".svgDiv").children();
    for (var i = 0; i < svgContainer.length; i++) {
        svgContainer[i].innerHTML = "000";
    }
}


$(document).ready(function() {
    console.log("ready!");
    createRegisterDivs();


})
