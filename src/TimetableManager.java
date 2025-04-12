import javax.swing.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.ArrayList;
import java.util.List;

// Class to represent a single timetable entry
class TimetableEntry {
    private String subjectCode;
    private String[] sessions; // Array to hold session details

    public TimetableEntry(String subjectCode, String[] sessions) {
        this.subjectCode = subjectCode;
        this.sessions = sessions;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public String[] getSessions() {
        return sessions;
    }
}

// Class to represent the timetable
class Timetable {
    private List<TimetableEntry> timetableEntries; // List to hold timetable entries

    public Timetable() {
        timetableEntries = new ArrayList<>();
    }

    // Method to add a timetable entry
    public void addEntry(String subjectCode, String[] sessions) {
        TimetableEntry entry = new TimetableEntry(subjectCode, sessions);
        timetableEntries.add(entry);
    }

    // Method to view the timetable
    public String viewTimetable() {
        StringBuilder timetableDisplay = new StringBuilder("Timetable:\n");
        timetableDisplay.append(String.format("%-15s %s\n", "Subject Code", "Sessions"));
        timetableDisplay.append("-----------------------------------------\n");

        for (TimetableEntry entry : timetableEntries) {
            timetableDisplay.append(String.format("%-15s ", entry.getSubjectCode()));
            for (String session : entry.getSessions()) {
                timetableDisplay.append(session).append(" | ");
            }
            timetableDisplay.append("\n");
        }
        return timetableDisplay.toString();
    }
}

// GUI class for the timetable management
public class TimetableManager {
    private Timetable ictTimetable;
    private Timetable bstTimetable;
    private Timetable etTimetable;

    public TimetableManager() {
        this.ictTimetable = new Timetable(); // Initialize ICT timetable
        this.bstTimetable = new Timetable(); // Initialize BST timetable
        this.etTimetable = new Timetable(); // Initialize ET timetable
        populateTimetables(); // Populate with example data
        createAndShowGUI(); // Create and show the GUI
    }

    // Method to populate the timetables with example data
    private void populateTimetables() {
        // ICT Timetable
        String[] ict2113Sessions = {"Monday 9-11 AM", "Wednesday 9-11 AM", "Friday 9-11 AM"};
        String[] ict2122Sessions = {"Tuesday 10-12 PM", "Thursday 10-12 PM"};
        ictTimetable.addEntry("ICT2113", ict2113Sessions);
        ictTimetable.addEntry("ICT2122", ict2122Sessions);

        // BST Timetable
        String[] bst101Sessions = {"Monday 11-1 PM", "Wednesday 11-1 PM"};
        String[] bst102Sessions = {"Tuesday 1-3 PM", "Thursday 1-3 PM"};
        bstTimetable.addEntry("BST101", bst101Sessions);
        bstTimetable.addEntry("BST102", bst102Sessions);

        // ET Timetable
        String[] et201Sessions = {"Monday 2-4 PM", "Wednesday 2-4 PM"};
        String[] et202Sessions = {"Tuesday 3-5 PM", "Thursday 3-5 PM"};
        etTimetable.addEntry("ET201", et201Sessions);
        etTimetable.addEntry("ET202", et202Sessions);
    }

    // Method to create and show the GUI
    private void createAndShowGUI() {
        JFrame frame = new JFrame("Timetable Manager");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(400, 300);

        JPanel panel = new JPanel();
        frame.add(panel);

        // Create the main View Timetable button
        JButton viewButton = new JButton("View Timetable");

        // Create department buttons (initially hidden)
        JButton ictButton = new JButton("Department ICT");
        JButton bstButton = new JButton("Department BST");
        JButton etButton = new JButton("Department ET");

        ictButton.setVisible(false);
        bstButton.setVisible(false);
        etButton.setVisible(false);

        // Add View Timetable button to the panel
        panel.add(viewButton);

        // When View Timetable is clicked, show department buttons
        viewButton.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                // Hide the View Timetable button
                viewButton.setVisible(false);

                // Show the department buttons
                ictButton.setVisible(true);
                bstButton.setVisible(true);
                etButton.setVisible(true);

                // Refresh the panel
                panel.revalidate();
                panel.repaint();
            }
        });

        // Add department buttons to the panel
        panel.add(ictButton);
        panel.add(bstButton);
        panel.add(etButton);

        // Action listeners for each department
        ictButton.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                String timetableDisplay = ictTimetable.viewTimetable();
                JOptionPane.showMessageDialog(frame, timetableDisplay, "ICT Timetable", JOptionPane.INFORMATION_MESSAGE);
            }
        });

        bstButton.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                String timetableDisplay = bstTimetable.viewTimetable();
                JOptionPane.showMessageDialog(frame, timetableDisplay, "BST Timetable", JOptionPane.INFORMATION_MESSAGE);
            }
        });

        etButton.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                String timetableDisplay = etTimetable.viewTimetable();
                JOptionPane.showMessageDialog(frame, timetableDisplay, "ET Timetable", JOptionPane.INFORMATION_MESSAGE);
            }
        });

        frame.setVisible(true);
    }

    // Main method to run the application
    public static void main(String[] args) {
        SwingUtilities.invokeLater(new Runnable() {
            public void run() {
                new TimetableManager();
            }
        });
    }
}
