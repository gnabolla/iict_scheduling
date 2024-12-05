// script.js

(() => {
    'use strict';

    const ScheduleApp = {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        interval: 30, // 30-minute intervals
        timeSlotsList: [
            { label: "7:30-8:00", start: 450, end: 480 },
            { label: "8:00-8:30", start: 480, end: 510 },
            { label: "8:30-9:00", start: 510, end: 540 },
            { label: "9:00-9:30", start: 540, end: 570 },
            { label: "9:30-10:00", start: 570, end: 600 },
            { label: "10:00-10:30", start: 600, end: 630 },
            { label: "10:30-11:00", start: 630, end: 660 },
            { label: "11:00-11:30", start: 660, end: 690 },
            { label: "11:30-12:00", start: 690, end: 720 },
            { label: "12:00-12:30", start: 720, end: 750 },
            { label: "12:30-1:00", start: 750, end: 780 },
            { label: "1:00-1:30", start: 780, end: 810 },
            { label: "1:30-2:00", start: 810, end: 840 },
            { label: "2:00-2:30", start: 840, end: 870 },
            { label: "2:30-3:00", start: 870, end: 900 },
            { label: "3:00-3:30", start: 900, end: 930 },
            { label: "3:30-4:00", start: 930, end: 960 },
            { label: "4:00-4:30", start: 960, end: 990 },
            { label: "4:30-5:00", start: 990, end: 1020 }
        ],
        isSelecting: false,
        startCell: null,
        selectedCells: [],
        currentMode: 'single',
        schedules: [],
        currentEditingSchedule: null,

        init() {
            // Initialize elements
            this.mainTimetable = document.getElementById('mainTimetable');
            this.modalTimetable = document.getElementById('modalTimetable');
            this.modal = document.getElementById('scheduleModal');
            this.openModalButton = document.getElementById('openModalButton');
            this.closeModal = document.querySelector('.close');

            // Bind events
            this.bindEvents();

            // Generate timetables
            this.generateTimetable(this.mainTimetable);
            this.generateTimetable(this.modalTimetable);

            // Load schedules from localStorage
            this.loadSchedules();

            // Initialize view list
            this.populateViewList();
        },

        bindEvents() {
            // Modal handling
            this.openModalButton.addEventListener('click', () => this.openModal());
            this.closeModal.addEventListener('click', () => this.closeModalHandler());
            window.addEventListener('click', (e) => {
                if (e.target == this.modal) {
                    this.closeModalHandler();
                }
            });

            // Prevent text selection during drag
            document.addEventListener('dragstart', (e) => e.preventDefault());

            // Selection Mode Radio Buttons
            const modeRadios = document.querySelectorAll('input[name="mode"]');
            modeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => this.changeSelectionMode(e));
            });

            // Event Listeners for Modal Timetable Selection
            this.modalTimetable.addEventListener('mousedown', (e) => this.startSelecting(e));
            this.modalTimetable.addEventListener('mousemove', (e) => this.selecting(e));
            document.addEventListener('mouseup', () => this.stopSelecting());

            // Save and Delete Buttons
            document.getElementById('saveScheduleButton').addEventListener('click', () => this.saveSchedule());
            document.getElementById('deleteScheduleButton').addEventListener('click', () => this.deleteSchedule());

            // View Schedule Inputs
            document.getElementById('viewType').addEventListener('change', () => this.changeViewType());
            document.getElementById('viewValue').addEventListener('input', () => this.displaySchedules());

            // Main Timetable Click
            this.mainTimetable.addEventListener('click', (e) => this.handleMainTimetableClick(e));

            // Input Fields to Update Overlays
            document.getElementById('faculty').addEventListener('input', () => this.updateModalTimetableOverlays());
            document.getElementById('classSection').addEventListener('input', () => this.updateModalTimetableOverlays());
            document.getElementById('room').addEventListener('input', () => this.updateModalTimetableOverlays());

            // Overlay Option Checkboxes
            document.getElementById('overlayFaculty').addEventListener('change', () => this.updateModalTimetableOverlays());
            document.getElementById('overlayClassSection').addEventListener('change', () => this.updateModalTimetableOverlays());
            document.getElementById('overlayRoom').addEventListener('change', () => this.updateModalTimetableOverlays());

            // Export and Import
            document.getElementById('exportSchedulesButton').addEventListener('click', () => this.exportSchedules());
            document.getElementById('importSchedulesButton').addEventListener('click', () => document.getElementById('importSchedulesInput').click());
            document.getElementById('importSchedulesInput').addEventListener('change', (e) => this.importSchedules(e));

            // Print
            document.getElementById('printScheduleButton').addEventListener('click', () => window.print());

            document.getElementById('clearDataButton').addEventListener('click', () => this.clearSavedData()); // New event binding
        },

        openModal() {
            this.modal.style.display = 'block';
            this.generateTimetable(this.modalTimetable);
            this.updateModeClasses();
            this.clearSelection();
            this.updateModalTimetableOverlays();
        },

        closeModalHandler() {
            this.modal.style.display = 'none';
            this.clearSelection();
            this.resetForm();
        },

        generateTimetable(timetableElement) {
            timetableElement.innerHTML = ''; // Clear existing content

            // Add headers
            const headers = ['Time', ...this.days];
            headers.forEach(header => {
                const headerDiv = document.createElement('div');
                headerDiv.className = 'header';
                headerDiv.textContent = header;
                timetableElement.appendChild(headerDiv);
            });

            this.timeSlotsList.forEach(slot => {
                // Add time label
                const timeLabelDiv = document.createElement('div');
                timeLabelDiv.className = 'time-label';
                timeLabelDiv.textContent = slot.label;
                timetableElement.appendChild(timeLabelDiv);

                // Add slots for each day
                for (let day = 0; day < 5; day++) {
                    const slotDiv = document.createElement('div');
                    slotDiv.className = 'time-slot';
                    slotDiv.dataset.day = day;
                    slotDiv.dataset.time = slot.start; // Use start time in minutes
                    timetableElement.appendChild(slotDiv);
                }
            });

            // Populate modal timetable with existing schedules
            if (timetableElement === this.modalTimetable) {
                this.populateModalTimetable();
            }
        },

        changeSelectionMode(e) {
            this.currentMode = e.target.value;
            this.updateModeClasses();
            this.clearSelection();
        },

        updateModeClasses() {
            this.modalTimetable.classList.remove('single', 'mwf', 'tth');
            this.modalTimetable.classList.add(this.currentMode);
        },

        clearSelection() {
            this.selectedCells.forEach(cell => cell.classList.remove('selected'));
            this.selectedCells = [];
            this.updateSelectionInfo();
        },

        resetForm() {
            document.getElementById('scheduleForm').reset();
            this.currentEditingSchedule = null;
            document.getElementById('saveScheduleButton').textContent = 'Save Schedule';
            document.getElementById('deleteScheduleButton').style.display = 'none';
        },

        getTimeSlotFromEvent(e) {
            if (e.target.classList.contains('time-slot')) {
                return e.target;
            }
            return null;
        },

        getMirroredDays(day) {
            if (this.currentMode === 'mwf' && [0, 2, 4].includes(day)) {
                return [0, 2, 4];
            } else if (this.currentMode === 'tth' && [1, 3].includes(day)) {
                return [1, 3];
            }
            return [day];
        },

        updateSelectionInfo() {
            const info = document.getElementById('selection-info');
            if (this.selectedCells.length === 0) {
                info.textContent = 'Selection Info: No cells selected';
                return;
            }

            const timesByDay = {};
            this.selectedCells.forEach(cell => {
                const day = parseInt(cell.dataset.day);
                const time = parseInt(cell.dataset.time);
                if (!timesByDay[day]) {
                    timesByDay[day] = [];
                }
                timesByDay[day].push(time);
            });

            const selectionData = [];
            for (const day in timesByDay) {
                const times = timesByDay[day];
                const startTime = Math.min(...times);
                const endTime = Math.max(...times) + this.interval;
                selectionData.push({
                    day: this.days[day],
                    startTime: this.getLabelForTime(startTime),
                    endTime: this.getLabelForTime(endTime)
                });
            }

            info.innerHTML = 'Selection Info:<br>' + selectionData.map(data => 
                `Day: ${data.day}<br>Start Time: ${data.startTime}<br>End Time: ${data.endTime}<br><br>`
            ).join('');
        },

        getLabelForTime(time) {
            const slot = this.timeSlotsList.find(s => s.start === time);
            return slot ? slot.label.split('-')[0] : this.createTimeString(time);
        },

        createTimeString(time) {
            let hours = Math.floor(time / 60);
            const minutes = time % 60;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        },

        startSelecting(e) {
            const slot = this.getTimeSlotFromEvent(e);
            if (!slot) return;

            this.isSelecting = true;
            this.startCell = slot;

            if (!e.ctrlKey) {
                this.clearSelection();
            }

            const mirroredDays = this.getMirroredDays(parseInt(slot.dataset.day));

            mirroredDays.forEach(day => {
                const cell = this.getModalCell(day, parseInt(slot.dataset.time));
                if (cell && !this.selectedCells.includes(cell)) {
                    cell.classList.add('selected');
                    this.selectedCells.push(cell);
                }
            });

            this.updateSelectionInfo();
        },

        selecting(e) {
            if (!this.isSelecting) return;

            const slot = this.getTimeSlotFromEvent(e);
            if (!slot) return;

            const currentDay = parseInt(slot.dataset.day);
            const currentTime = parseInt(slot.dataset.time);
            const startDay = parseInt(this.startCell.dataset.day);
            const startTimeVal = parseInt(this.startCell.dataset.time);

            if (this.currentMode === 'mwf' && ![0, 2, 4].includes(currentDay)) return;
            if (this.currentMode === 'tth' && ![1, 3].includes(currentDay)) return;
            if (this.currentMode === 'single' && currentDay !== startDay) return;

            const mirroredDays = this.getMirroredDays(startDay);
            const start = Math.min(startTimeVal, currentTime);
            const end = Math.max(startTimeVal, currentTime);

            if (!e.ctrlKey) {
                this.clearSelection();
            }

            mirroredDays.forEach(day => {
                this.timeSlotsList.forEach(slotItem => {
                    if (slotItem.start >= start && slotItem.start <= end) {
                        const cell = this.getModalCell(day, slotItem.start);
                        if (cell && !this.selectedCells.includes(cell)) {
                            cell.classList.add('selected');
                            this.selectedCells.push(cell);
                        }
                    }
                });
            });

            this.updateSelectionInfo();
        },

        stopSelecting() {
            this.isSelecting = false;
            this.updateSelectionInfo();
        },

        getModalCell(day, time) {
            return Array.from(this.modalTimetable.children).find(cell =>
                cell.classList.contains('time-slot') &&
                parseInt(cell.dataset.day) === day &&
                parseInt(cell.dataset.time) === time
            );
        },

        getMainCell(day, time) {
            return Array.from(this.mainTimetable.children).find(cell =>
                cell.classList.contains('time-slot') &&
                parseInt(cell.dataset.day) === day &&
                parseInt(cell.dataset.time) === time
            );
        },

        saveSchedule() {
            const faculty = document.getElementById('faculty').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const classSection = document.getElementById('classSection').value.trim();
            const room = document.getElementById('room').value.trim();
            const classType = document.getElementById('classType').value;

            if (!faculty || !subject || !classSection || !room) {
                alert('Please fill in all the fields.');
                return;
            }

            const timeSlots = this.selectedCells.map(cell => ({
                day: parseInt(cell.dataset.day),
                time: parseInt(cell.dataset.time)
            }));

            if (timeSlots.length === 0) {
                alert('Please select time slots on the timetable.');
                return;
            }

            const newSchedule = {
                id: this.currentEditingSchedule ? this.currentEditingSchedule.id : Date.now(),
                faculty,
                subject,
                classSection,
                room,
                classType,
                timeSlots
            };

            const conflicts = this.checkForConflicts(newSchedule, this.currentEditingSchedule ? this.currentEditingSchedule.id : null);
            if (conflicts.length > 0) {
                let conflictMessage = 'Conflict detected with the following schedules:\n\n';
                conflicts.forEach(conflict => {
                    conflictMessage += `- ${conflict.schedule.subject} (${conflict.schedule.classSection}) on ${this.days[conflict.timeSlot.day]} at ${this.getLabelForTime(conflict.timeSlot.time)}\n`;
                });
                alert(conflictMessage);
                return;
            }

            if (this.currentEditingSchedule) {
                this.schedules = this.schedules.map(schedule =>
                    schedule.id === this.currentEditingSchedule.id ? newSchedule : schedule
                );
                this.currentEditingSchedule = null;
                document.getElementById('saveScheduleButton').textContent = 'Save Schedule';
                document.getElementById('deleteScheduleButton').style.display = 'none';
            } else {
                this.schedules.push(newSchedule);
            }

            alert('Schedule saved successfully.');
            this.resetForm();
            this.clearSelection();
            this.modal.style.display = 'none';
            this.displaySchedules();
            this.populateAutocompleteLists();
            this.populateViewList();
            this.saveSchedulesToLocalStorage();
        },

        checkForConflicts(newSchedule, ignoreScheduleId = null) {
            const conflicts = [];

            this.schedules.forEach(existingSchedule => {
                if (existingSchedule.id === ignoreScheduleId) return;

                const isConflictFaculty = existingSchedule.faculty.toLowerCase() === newSchedule.faculty.toLowerCase();
                const isConflictRoom = existingSchedule.room.toLowerCase() === newSchedule.room.toLowerCase();
                const isConflictClassSection = existingSchedule.classSection.toLowerCase() === newSchedule.classSection.toLowerCase();

                if (isConflictFaculty || isConflictRoom || isConflictClassSection) {
                    existingSchedule.timeSlots.forEach(existingSlot => {
                        newSchedule.timeSlots.forEach(newSlot => {
                            if (existingSlot.day === newSlot.day && existingSlot.time === newSlot.time) {
                                conflicts.push({
                                    entity: isConflictFaculty ? 'Faculty' : isConflictRoom ? 'Room' : 'Class/Section',
                                    schedule: existingSchedule,
                                    timeSlot: existingSlot
                                });
                            }
                        });
                    });
                }
            });

            return conflicts;
        },

        displaySchedules() {
            const viewType = document.getElementById('viewType').value;
            const viewValue = document.getElementById('viewValue').value.trim();

            this.generateTimetable(this.mainTimetable);

            if (viewValue === '') {
                return;
            }

            const filteredSchedules = this.schedules.filter(schedule =>
                schedule[viewType] &&
                schedule[viewType].toLowerCase() === viewValue.toLowerCase()
            );

            filteredSchedules.forEach((schedule) => {
                schedule.timeSlots.forEach(slot => {
                    const cell = this.getMainCell(slot.day, slot.time);
                    if (cell) {
                        cell.classList.add('scheduled', schedule.classType.toLowerCase());
                        cell.innerHTML = `
                            <div><strong>${schedule.subject}</strong></div>
                            <div>${schedule.classSection}</div>
                            <div>${schedule.room}</div>
                            <div>${schedule.classType}</div>
                        `;
                        cell.dataset.scheduleId = schedule.id;
                    }
                });
            });
        },

        populateAutocompleteLists() {
            const facultyList = document.getElementById('facultyList');
            const subjectList = document.getElementById('subjectList');
            const classSectionList = document.getElementById('classSectionList');
            const roomList = document.getElementById('roomList');

            const updateDatalist = (datalistElement, values) => {
                datalistElement.innerHTML = values.map(value => `<option value="${value}">`).join('');
            };

            const getUniqueValues = (key) => [...new Set(this.schedules.map(schedule => schedule[key]))];

            updateDatalist(facultyList, getUniqueValues('faculty'));
            updateDatalist(subjectList, getUniqueValues('subject'));
            updateDatalist(classSectionList, getUniqueValues('classSection'));
            updateDatalist(roomList, getUniqueValues('room'));
        },

        populateViewList() {
            const viewType = document.getElementById('viewType').value;
            const viewList = document.getElementById('viewList');

            const getUniqueValues = (key) => [...new Set(this.schedules.map(schedule => schedule[key]))];

            const values = getUniqueValues(viewType);
            viewList.innerHTML = values.map(value => `<option value="${value}">`).join('');
        },

        changeViewType() {
            document.getElementById('viewValue').value = '';
            this.populateViewList();
            this.displaySchedules(); // Refresh the timetable
        },

        handleMainTimetableClick(e) {
            let target = e.target;
            if (target.classList.contains('scheduled') || target.parentNode.classList.contains('scheduled')) {
                if (target.parentNode.classList.contains('scheduled')) {
                    target = target.parentNode;
                }
                const scheduleId = parseInt(target.dataset.scheduleId);
                const schedule = this.schedules.find(s => s.id === scheduleId);
                if (schedule) {
                    this.openEditModal(schedule);
                }
            }
        },

        openEditModal(schedule) {
            this.currentEditingSchedule = schedule;

            document.getElementById('faculty').value = schedule.faculty;
            document.getElementById('subject').value = schedule.subject;
            document.getElementById('classSection').value = schedule.classSection;
            document.getElementById('room').value = schedule.room;
            document.getElementById('classType').value = schedule.classType;

            this.clearSelection();
            this.generateTimetable(this.modalTimetable);
            this.updateModalTimetableOverlays();

            schedule.timeSlots.forEach(slot => {
                const cell = this.getModalCell(slot.day, slot.time);
                if (cell) {
                    cell.classList.add('selected');
                    this.selectedCells.push(cell);
                }
            });

            this.updateSelectionInfo();
            this.modal.style.display = 'block';
            document.getElementById('saveScheduleButton').textContent = 'Update Schedule';
            document.getElementById('deleteScheduleButton').style.display = 'inline-block';
        },

        deleteSchedule() {
            if (this.currentEditingSchedule) {
                this.schedules = this.schedules.filter(s => s.id !== this.currentEditingSchedule.id);
                this.currentEditingSchedule = null;
                alert('Schedule deleted successfully.');
                this.resetForm();
                this.clearSelection();
                this.modal.style.display = 'none';
                this.displaySchedules();
                this.populateAutocompleteLists();
                this.populateViewList();
                this.saveSchedulesToLocalStorage();
                document.getElementById('saveScheduleButton').textContent = 'Save Schedule';
                document.getElementById('deleteScheduleButton').style.display = 'none';
            }
        },

        updateModalTimetableOverlays() {
            const faculty = document.getElementById('faculty').value.trim();
            const classSection = document.getElementById('classSection').value.trim();
            const room = document.getElementById('room').value.trim();

            const overlayFaculty = document.getElementById('overlayFaculty').checked;
            const overlayClassSection = document.getElementById('overlayClassSection').checked;
            const overlayRoom = document.getElementById('overlayRoom').checked;

            // Clear existing overlays
            this.clearModalOverlays();

            let schedulesToOverlay = [];

            if (overlayFaculty && faculty) {
                schedulesToOverlay = schedulesToOverlay.concat(
                    this.schedules.filter(s => s.faculty.toLowerCase() === faculty.toLowerCase() && s.id !== (this.currentEditingSchedule ? this.currentEditingSchedule.id : null))
                );
            }

            if (overlayClassSection && classSection) {
                schedulesToOverlay = schedulesToOverlay.concat(
                    this.schedules.filter(s => s.classSection.toLowerCase() === classSection.toLowerCase() && s.id !== (this.currentEditingSchedule ? this.currentEditingSchedule.id : null))
                );
            }

            if (overlayRoom && room) {
                schedulesToOverlay = schedulesToOverlay.concat(
                    this.schedules.filter(s => s.room.toLowerCase() === room.toLowerCase() && s.id !== (this.currentEditingSchedule ? this.currentEditingSchedule.id : null))
                );
            }

            // Remove duplicates
            schedulesToOverlay = [...new Set(schedulesToOverlay)];

            // Display schedules on modal timetable
            schedulesToOverlay.forEach(schedule => {
                schedule.timeSlots.forEach(slot => {
                    const cell = this.getModalCell(slot.day, slot.time);
                    if (cell) {
                        cell.classList.add('scheduled-overlay', schedule.classType.toLowerCase());
                        cell.innerHTML = `
                            <div><strong>${schedule.subject}</strong></div>
                            <div>${schedule.classSection}</div>
                            <div>${schedule.room}</div>
                            <div>${schedule.classType}</div>
                        `;
                        cell.title = `${schedule.subject} (${schedule.classSection}) in ${schedule.room}`;
                    }
                });
            });
        },

        clearModalOverlays() {
            const allCells = Array.from(this.modalTimetable.getElementsByClassName('time-slot'));
            allCells.forEach(cell => {
                cell.classList.remove('scheduled-overlay', 'lecture', 'lab');
                cell.innerHTML = '';
            });

            // Reapply selected cells
            this.selectedCells.forEach(cell => {
                cell.classList.add('selected');
                cell.innerHTML = '';
            });
        },

        exportSchedules() {
            if (this.schedules.length === 0) {
                alert('No schedules to export.');
                return;
            }
            const dataStr = JSON.stringify(this.schedules, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            const exportFileDefaultName = 'schedules.json';

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            document.body.appendChild(linkElement);
            linkElement.click();
            document.body.removeChild(linkElement);
        },

        importSchedules(event) {
            const file = event.target.files[0];
            if (!file) return;

            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                try {
                    const importedSchedules = JSON.parse(e.target.result);
                    if (Array.isArray(importedSchedules)) {
                        let importedCount = 0;
                        let skippedCount = 0;
                        importedSchedules.forEach((newSchedule) => {
                            newSchedule.id = Date.now() + Math.random();
                            const conflicts = this.checkForConflicts(newSchedule, newSchedule.id);
                            if (!conflicts.length) {
                                this.schedules.push(newSchedule);
                                importedCount++;
                            } else {
                                skippedCount++;
                            }
                        });
                        this.saveSchedulesToLocalStorage();
                        this.displaySchedules();
                        this.populateAutocompleteLists();
                        this.populateViewList();
                        alert(`Import completed. ${importedCount} schedules imported, ${skippedCount} schedules skipped due to conflicts.`);
                    } else {
                        throw new Error('Invalid schedule data.');
                    }
                } catch (error) {
                    alert('Failed to import schedules: ' + error.message);
                }
            };
            fileReader.readAsText(file);
        },

        saveSchedulesToLocalStorage() {
            localStorage.setItem('schedules', JSON.stringify(this.schedules));
        },

        loadSchedules() {
            const savedSchedules = JSON.parse(localStorage.getItem('schedules'));
            if (savedSchedules) {
                this.schedules = savedSchedules;
                this.populateAutocompleteLists();
                this.populateViewList();
                this.displaySchedules();
            }
        },

        populateModalTimetable() {
            // Display all schedules in the modal timetable based on overlay options
            this.updateModalTimetableOverlays();
        },

        clearSavedData() {
            localStorage.removeItem('schedules');
            this.schedules = [];
            this.displaySchedules();
            this.populateAutocompleteLists();
            this.populateViewList();
            alert('Saved data cleared successfully.');
        }
    };

    ScheduleApp.init();

})();
