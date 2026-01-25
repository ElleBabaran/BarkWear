class Violation:
    def __init__(self, student_id, violation_type, timestamp=None):
        self.student_id = student_id
        self.violation_type = violation_type
        self.timestamp = timestamp
