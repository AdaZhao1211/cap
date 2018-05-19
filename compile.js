// int main(){
//   int x = 1;
// }


//Prudence Mar 14
//Dissect the json data from godbolt.org

//Json example
data = {
    "code": 0,
    "stdout": [],
    "stderr": [],
    "okToCache": true,
    "inputFilename": "/tmp/compiler-explorer-compiler118215-62-1nnqbp.wdb6k/example.cpp",
    "hasOptOutput": false,
    "asmSize": 3039,
    "asm": [{ "text": "main:", "source": null }, { "text": "  addiu $sp,$sp,-24", "source": { "file": null, "line": 1 } }, { "text": "  sw $fp,20($sp)", "source": { "file": null, "line": 1 } }, { "text": "  move $fp,$sp", "source": { "file": null, "line": 1 } }, { "text": "  li $2,5 # 0x5", "source": { "file": null, "line": 2 } }, { "text": "  sw $2,8($fp)", "source": { "file": null, "line": 2 } }, { "text": "  lw $2,8($fp)", "source": { "file": null, "line": 3 } }, { "text": "  nop", "source": { "file": null, "line": 3 } }, { "text": "  addiu $2,$2,5", "source": { "file": null, "line": 3 } }, { "text": "  sw $2,8($fp)", "source": { "file": null, "line": 3 } }, { "text": "  move $2,$0", "source": { "file": null, "line": 4 } }, { "text": "  move $sp,$fp", "source": { "file": null, "line": 4 } }, { "text": "  lw $fp,20($sp)", "source": { "file": null, "line": 4 } }, { "text": "  addiu $sp,$sp,24", "source": { "file": null, "line": 4 } }, { "text": "  j $31", "source": { "file": null, "line": 4 } }, { "text": "  nop", "source": { "file": null, "line": 4 } }, { "text": "", "source": null }]
}

//Format a number to a fixed length
function digi(num, length) {
    num = num.toString(2)
    while (num.length < length) {
        num = "0" + num
    }
    return num
}


/*
Registers
OpTable: instructions to opcoce
FuncTable: instructions to function code (for R type)
index($sp): return the index of the register
parse(8($sp)): return the shift 2 and indexed register
getType(instr): return "R","I" or "J" based on the instruction
getOpcode(instr): return opcode according to the instruction
*/
var Registers = {
    // "use strict";
    // values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 0, 0, 0, 0, 0],

    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

    table: ["$zero", "$at", "$v0", "$v1", "$a0", "$a1", "$a2", "$a3",
        "$t0", "$t1", "$t2", "$t3", "$t4", "$t5", "$t6", "$t7",
        "$s0", "$s1", "$s2", "$s3", "$s4", "$s5", "$s6", "$s7",
        "$t8", "$t9",
        "$k0", "$k1", "$gp", "$sp", "$fp", "$ra"
    ],

    RType: ["move", "add", "addu", "sub", "subu", "div", "divu", "jr", "and", "or"],
    IType: ["addi", "addiu", "beq", "bne", "lw", "sw", "lui", "li"], //li is treated as lui
    JType: ["j", "jal"],

    database: {
        "add": [0x00, 0x20],
        "addi": [0x08, null],
        "addiu": [0x09, null],
        "addu": [0x00, 0x21],
        "and": [0x00, 0x24],
        "andi": [0x0C, null],
        "beq": [0x04, null],
        "bne": [0x05, null],
        "div": [0x00, 0x1A],
        "divu": [0x00, 0x1B],
        "j": [0x02, null],
        "jal": [0x03, null],
        "jr": [0x00, 0x08],
        "lbu": [0x24, null],
        "lhu": [0x25, null],
        "lui": [0x0F, null],
        "lw": [0x23, null],
        "mfhi": [0x00, 0x10],
        "mflo": [0x00, 0x12],
        "mfc0": [0x10, null],
        "mult": [0x00, 0x18],
        "multu": [0x00, 0x19],
        "nor": [0x00, 0x27],
        "xor": [0x00, 0x26],
        "or": [0x00, 0x25],
        "ori": [0x0D, null],
        "sb": [0x28, null],
        "sh": [0x29, null],
        "slt": [0x00, 0x2A],
        "slti": [0x0A, null],
        "sltiu": [0x0B, null],
        "sltu": [0x00, 0x2B],
        "sll": [0x00, 0x00],
        "srl": [0x00, 0x02],
        "sra": [0x00, 0x03],
        "sub": [0x00, 0x22],
        "subu": [0x00, 0x23],
        "sw": [0x2B, null]
    },

    OpTable: {
        // "addi": 0x08,
        // "addiu": 0x09,
        // "li": 0x23,
        // "lw": 0x23,
        // "sw": 0x2B,
        // "lui": 0x0F,
        // "li": 0x0F,
        // "j": 0x02
    },

    FuncTable: {

        // "move": 0x20,
        // "add": 0x20,
        // "addu": 0x21,
        // "and": 0x24,
        // "jr": 0x08,
        // "or": 0x25
    },

    index: function(r_name) {
        if (r_name.indexOf('$') == -1) {
            return +r_name;
        }
        if (this.table.indexOf(r_name) != -1) {
            return this.table.indexOf(r_name);
        } else {
            return +r_name.slice(1);
        }
    },

    parse: function(r_name) {
        if (r_name.indexOf("(") != -1) {
            var shifter = parseInt(r_name.slice(0, r_name.indexOf("(")));
            var nb = this.index(r_name.slice(r_name.indexOf("(") + 1, r_name.length - 1));

            return [shifter, nb];
        } else {
            return [0, this.index(r_name)];
        }



    },

    get: function(index) {
        return this.values[index];
    },
    set: function(index, value) {
        this.values[index] = value
    },

    getRegs: function() {
        var regs = [];
        for (var i = 0; i < this.values.length; i++) {
            num = this.values[i].toString();
            while (num.length < 3) {
                num = "0" + num;
            }
            regs.push(num);
        }
        return regs;
    },

    getType: function(op) {
        if (this.RType.indexOf(op) != -1) {
            return "R";
        } else if (this.IType.indexOf(op) != -1) {
            return "I";
        } else if (this.JType.indexOf(op) != -1) {
            return "J";
        }
    },

    getOpcode: function(op) {
        if (this.OpTable[op] != undefined) {
            return this.OpTable[op]
        } else {
            return 0x00;
        }
    }
}
// Fill up the OpTable and FuncTable
for (var key in Registers.database) {
    element = Registers.database[key]

    Registers.OpTable[key] = element[0]
    Registers.FuncTable[key] = element[1]

}



/*
An object to simulate each instruction
Format(String),
*/
function Format(instr) {
    //instr: "  addiu $sp,$sp,-24" -> "addiu $sp,$sp,-24"
    this.instr = instr.trim();
    if (this.instr.indexOf('#') != -1) {
        this.instr = this.instr.slice(0, this.instr.indexOf('#') - 1)
    }

    this.recognize();
    this.bit = this.getBits(this.type);

}

//Analyze the elements of the string
Format.prototype.recognize = function() {
    // var format = { op: null }
    //If wrong format
    if (this.instr.indexOf(' ') == -1) {
        this.op = this.instr;
        // return format;
        return
    }
    /* addiu $sp,$sp,-24
       this.op = "addiu"
       para = "$sp,$sp,-24"
    */
    this.op = this.instr.slice(0, this.instr.indexOf(' '))
    var para = this.instr.slice(this.instr.indexOf(' ') + 1)


    //ToDo: Manilupated Type!!!
    if (this.op == 'addiu') {
        this.op = 'addi'
    } else if (this.op == 'subiu') {
        this.op = 'subi'
    } else if (this.op == 'sltiu') {
        this.op = 'slti'
    }

    this.type = Registers.getType(this.op)
    if (this.type === "R") {
        this.rd = null;
        this.rs = null;
        this.rt = null;

        this.shift = null;
        this.func = null;

        /*
        para = "$sp,$sp,-24"
        rd: sp
        rs: sp
        rt: -24
        */
        this.rd = para.slice(0, para.indexOf(','))
        this.rd = Registers.index(this.rd)
        para = para.slice(para.indexOf(',') + 1)

        this.rs = para.slice(0, para.indexOf(','))
        this.rs = Registers.index(this.rs)
        para = para.slice(para.indexOf(',') + 1)


        //Need to confirm which among rs, rt and rd to shift

        var a = Registers.parse(para)
        this.rt = a[1]
        this.shift = a[0]
        this.func = this.op

    } else if (this.type === "I") {
        this.rt = null;
        this.rs = null;
        this.add = null;

        this.rt = para.slice(0, para.indexOf(','))
        this.rt = Registers.index(this.rt)
        para = para.slice(para.indexOf(',') + 1)
        if (para.indexOf(',') != -1) {
            this.rs = para.slice(0, para.indexOf(','))
            this.rs = Registers.index(this.rs)
            para = para.slice(para.indexOf(',') + 1)
            this.add = +para
        } else {
            this.rs = para
            var a = Registers.parse(this.rs)
            this.rs = a[1]
            this.add = a[0]
        }

    } else if (this.type === "J") {
        this.add = Registers.index(para)
        console.log("Add", this.add)
    }

}

//Transform the string to binary according to the instruction type
Format.prototype.getBits = function(type) {

    var opcode = Registers.getOpcode(this.op);
    opcode = digi(opcode, 6);
    var rs = this.rs | 0;
    var rt = this.rt | 0;
    var rd = this.rd | 0;
    var shift = this.shift | 0
    var func = Registers.FuncTable[this.func] | 0
    var add = this.add | 0;

    if (type === "R") {
        opcode += digi(rs, 5) + digi(rt, 5) + digi(rd, 5) + digi(shift, 5) + digi(func, 6)
    } else if (type === "I") {
        opcode += digi(rs, 5) + digi(rt, 5) + digi(add, 16)
    } else if (type === "J") {
        opcode += digi(add, 26);
    }

    return opcode;
}

//Run the instruction codes in the specified lines
function analyze(data, nbline) {
    var arr = [];
    for (var i = 0; i < data.asm.length; i++) {
        var item = data.asm[i];
        if (item.source != null && item.source.line == nbline) {
            console.log(item.text)
            var f = new Format(item.text)
            console.log("opcode", f.bit)
            console.log(" ")
            arr.push(f)
        }
    }
    return arr;
}


//Input: Array
//Output: list of Format objects
function analyzeall(data) {
    var arr = [];
    var line_max = 0;

    for (var i = 0; i < data.asm.length; i++) {
        if (data.asm[i].source != null &&
            data.asm[i].text.indexOf(':') == -1) {
            // console.log(data.asm[i].text)
            var f = new Format(data.asm[i].text);
            arr.push(f);
        }
    }

    return arr;

}

//Input:json compile data,line number
//Output: analyzed instruction code
// arr = analyze(data, 1)

// console.log("Analyzed instructions")
// arr = analyzeall(data);
// console.log(arr)




/*Simulator
Simulate the output of the MIPS architecture

instruction = {operation:, rs:$2 rt:$sp,addr:}
 case: lw
 registers[rs] = registers.get(rt)

*/



/*
    RType: ["add", "addu", "sub", "subu", "div", "divu", "jr", "and", "or"],
    IType: ["addi", "addiu", "beq", "bne", "lw", "sw", "lui", "li"], //li is treated as lui
    JType: ["j", "jal"],
*/

function simulate(format) {
    console.log("Simulate " + format.instr);
    console.log(Registers.values);
    if (format.type === "R") {
        if (format.op.indexOf("add") != -1) {
            Registers.set(format.rd, Registers.get(format.rs) + (format.shift + Registers.get(format.rt)));
        }
        return {
            READ: [format.rs, format.rt],
            WRITE: [format.rd]
        };

    } else if (format.type === "I") {
        // console.log("I rt ", format.rs)
        if (format.op === "lw" || format.op === "lui") {

            Registers.set(format.rt, format.add + Registers.get(format.rs))
        } else if (format.op === "li") {
            Registers.set(format.rt, format.add + format.rs)
        } else if (format.op === "sw") {
            //write data to memory
            // Registers.set(format.add + Registers.get(format.rs), format.rt)
            DataMemory.memory[format.add + Registers.get(format.rs)] = Registers.get(format.rt)
        } else if (format.op.indexOf("add") != -1) {
            // console.log("Simulate ",format.rt,format.rs, format.add,Registers.get(format.rs))
            Registers.set(format.rt, Registers.get(format.rs) + format.add)
        } else if (format.op === "move") {
            console.log("Simulate ", format, format.add + format.rs)
            Registers.set(format.rt, Registers.get(format.rs))
        }

        return {
            READ: [format.rs],
            WRITE: [format.rt]
        };

    } else if (format.type === "J") {

        return {
            READ: null,
            WRITE: null
        };
    }
}


//Simulate the registers

// console.log(Registers.getRegs())
// for (var i = 0; i < arr.length; i += 1) {

// setTimeout(function(x) {


// var change = simulate(arr[i]);




// console.log(change);
// console.log(Registers.getRegs());
// }, i * 1000, i)
// }
