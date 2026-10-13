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
        {id:'gnd',label:'GND',target:'GND'},
        {id:'vcc',label:'VCC',target:board.voltage},
        {id:'scl',label:'scl',target:board.i2c.scl},
        {id:'sda',label:'SDA',target:board.i2c.sda},
    ];
}