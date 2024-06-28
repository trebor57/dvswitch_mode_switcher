/**
 * This file is part of the DVSwitch Mode Switcher project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

class Mode {
    constructor(name) {
        this.name = name;
    }

    static getAllModes() {
        return ['DMR', 'YSF', 'P25', 'DSTAR', 'NXDN'].map(mode => new Mode(mode));
    }
}

module.exports = Mode;