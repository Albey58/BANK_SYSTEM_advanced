import sys
import traceback

try:
    import validators
    print("Success")
except Exception as e:
    traceback.print_exc()
