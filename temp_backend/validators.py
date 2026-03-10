class DummySchema:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
    @property
    def model_dump(self):
        return lambda: self.__dict__
    
    def dict(self):
        return self.__dict__

class UserRegistrationSchema(DummySchema): pass
class LoginSchema(DummySchema): pass
class DepositSchema(DummySchema): pass
class WithdrawalSchema(DummySchema): pass
class TransferSchema(DummySchema): pass
class UpdateProfileSchema(DummySchema): pass
class CreateAccountSchema(DummySchema): pass
class SetPinSchema(DummySchema): pass
class ResetPinSchema(DummySchema): pass
class BranchCreateSchema(DummySchema): pass
class JoinAccountInviteSchema(DummySchema): pass
class LoanApplicationSchema(DummySchema): pass
class MissionCreateSchema(DummySchema): pass
class ApprovalActionSchema(DummySchema): pass
class PasswordResetRequestSchema(DummySchema): pass
class PasswordResetSchema(DummySchema): pass

