export const boards = {
    uno: {
        id: 'uno',
        label: 'Arduino Uno',
        voltage: '5V',
        i2c : {sda: 'A4', scl: 'A5'},
    },
};

export function pinoutFor(boardId) {
    const board = boards[boardId];
    return [
        {id:'gnd',label:'GND',target:'GND',desc:'Ground-0v'},
        {id:'vcc',label:'VCC',target:board.voltage,desc: `Power-${board.voltage} from board`},
        {id:'scl',label:'scl',target:board.i2c.scl,desc: `Clock line to Arduino ${board.i2c.scl}`},
        {id:'sda',label:'SDA',target:board.i2c.sda,desc: `Data line to Arduino ${board.i2c.sda}`},
    ];
}